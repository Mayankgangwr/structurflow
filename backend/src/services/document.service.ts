import { storageService } from "@/integrations/storage.service";
import { AuditAction } from "@/models/audit-log.model";
import { DocumentStatus } from "@/models/document.model";
import auditLogRepository from "@/repositories/audit-log.repository";
import documentRepository, { DocumentQueryOptions } from "@/repositories/document.repository";
import { ApiErrors, DomainError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import crypto from "crypto";
import path from "path";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import pdfService from "./pdf.service";
import templateRepository from "@/repositories/template.repository";
import generatePdfFromTemplate from "@/utils/generatePdfFromTemplate";
import getPdfBufferFromUrl from "./getPdfBufferFromUrl";

class DocumentService {

    /**
    * Processes a direct file upload from the client.
    */
    async uploadDocument(
        file: Express.Multer.File,
        organizationId: string,
        projectId: string,
        userId: string,
        ipAddress?: string
    ) {
        // 1. Calculate SHA-256 hash of the file buffer
        const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

        // 2. Check for exact duplicates in the same organization

        const duplicateCount = await documentRepository.countByOrgAndHash(organizationId, fileHash);
        const isDuplicate = duplicateCount > 0;

        // 3. Define Local Folder and Filename
        const folder = `structurflow/${organizationId}`;
        const extension = path.extname(file.originalname);
        const filename = `${uuidv4()}${extension}`;

        // 4. Upload directly to Supabase Storage
        const uploadResult = await storageService.uploadFile(file.buffer, folder, filename, file.mimetype);

        // Extract text depending on file MIME type (PDF via PDF.js, Image via Gemini multimodal vision)
        let rawText = "";
        try {
            rawText = await pdfService.extractTextFromDocument(file.buffer, file.mimetype);
        } catch (extractErr: any) {
            logger.warn(`Text extraction warning for ${file.originalname}: ${extractErr.message}`);
            rawText = "";
        }

        // 5. Persist Document and Audit Log (Without Transactions for standalone DB)
        try {
            const document = await documentRepository.create({
                organizationId: new mongoose.Types.ObjectId(organizationId),
                projectId: new mongoose.Types.ObjectId(projectId),
                uploadedById: new mongoose.Types.ObjectId(userId),
                originalFileName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                fileHash,
                extractedData: rawText,
                publicId: uploadResult.public_id,
                secureUrl: uploadResult.secure_url,
                status: DocumentStatus.UPLOADED,
            });

            await auditLogRepository.create({
                organizationId: new mongoose.Types.ObjectId(organizationId),
                actorId: new mongoose.Types.ObjectId(userId),
                documentId: document._id as mongoose.Types.ObjectId,
                projectId: new mongoose.Types.ObjectId(projectId),
                action: AuditAction.DOCUMENT_UPLOADED,
                details: {
                    filename: file.originalname,
                    originalFileName: file.originalname,
                    size: file.size,
                    mimeType: file.mimetype,
                    status: DocumentStatus.UPLOADED,
                    isDuplicateWarning: isDuplicate
                },
                ipAddress
            });

            // Note: In Phase 4, we will queue the BullMQ processing job right here!

            return {
                document,
                warnings: isDuplicate ? ['An identical file has been uploaded previously.'] : []
            };
        } catch (error: any) {
            console.error('--- UPLOAD DOCUMENT ERROR ---', error);
            // Attempt to clean up the orphaned Cloudinary file asynchronously
            storageService.deleteFile(uploadResult.public_id).catch(() => { });

            if (error instanceof DomainError) throw error;
            throw new Error(`Failed to save document record: ${error.message}`);
        }
    }

    async proccessDocument(documentId: string, organizationId: string, userId?: string, ipAddress?: string) {
        // Get document
        const document = await documentRepository.findById(documentId);
        if (!document) throw ApiErrors.documentNotFound();

        // Get document's project
        const activeTemplate = await templateRepository.activeTemplateByProject(document.projectId.toString(), organizationId);
        if (!activeTemplate) throw ApiErrors.templateNotFound();

        const extractedData = document.extractedData;
        const schema = activeTemplate.templateSchema;

        if (!schema) {
            throw ApiErrors.badRequest("Active template schema is missing or invalid");
        }

        if (!extractedData) {
            throw ApiErrors.badRequest("Document contains no extracted text to transform");
        }

        const LLMResult = await pdfService.processPdfWithSchema(extractedData, schema.fields);

        await documentRepository.updateById(documentId, {
            status: DocumentStatus.TRANSFORMED,
            processingDetails: { aiResponse: LLMResult }
        });

        // Record Audit Log for DOCUMENT_TRANSFORMED
        try {
            await auditLogRepository.create({
                organizationId: new mongoose.Types.ObjectId(organizationId),
                actorId: (userId && mongoose.Types.ObjectId.isValid(userId))
                    ? new mongoose.Types.ObjectId(userId)
                    : (document.uploadedById as mongoose.Types.ObjectId),
                documentId: document._id as mongoose.Types.ObjectId,
                projectId: document.projectId as mongoose.Types.ObjectId,
                action: AuditAction.DOCUMENT_TRANSFORMED,
                details: {
                    filename: document.originalFileName,
                    originalFileName: document.originalFileName,
                    templateName: activeTemplate.originalFileName || (activeTemplate as any).name,
                    fieldsExtracted: Object.keys(LLMResult?.data || {}).length,
                    status: DocumentStatus.TRANSFORMED,
                },
                ipAddress
            });
        } catch (auditErr) {
            console.error("Failed to log DOCUMENT_TRANSFORMED:", auditErr);
        }

        return LLMResult;
    }

    async verifyDocument(
        documentId: string,
        organizationId: string,
        userId?: string,
        ipAddress?: string,
        correctedData?: Record<string, any>
    ) {
        const document = await documentRepository.findByIdAndOrg(documentId, organizationId);
        if (!document) {
            throw ApiErrors.documentNotFound();
        }

        const hasCorrections = Boolean(
            correctedData && typeof correctedData === "object" && Object.keys(correctedData).length > 0
        );

        // If already verified or exported, no corrections provided, and secureUrl already exists, return it directly
        if (
            !hasCorrections &&
            (document.status === DocumentStatus.VERIFIED || document.status === DocumentStatus.EXPORTED) &&
            document.processingDetails?.secureUrl
        ) {
            return document.processingDetails.secureUrl;
        }

        // Extracted data must exist to generate the verified document
        const currentData = document.processingDetails?.aiResponse?.data;
        if (!currentData && !hasCorrections) {
            if (document.status === DocumentStatus.UPLOADED) {
                throw ApiErrors.badRequest("Document has not been processed yet. Please transform the document first.");
            }
            throw ApiErrors.badRequest(`Document cannot be verified because extracted data is missing (current status: ${document.status}).`);
        }

        const finalData = hasCorrections
            ? { ...(currentData || {}), ...correctedData }
            : currentData;

        // 1. Get document's project active template
        const activeTemplate = await templateRepository.activeTemplateByProject(document.projectId.toString(), organizationId);
        if (!activeTemplate || !activeTemplate.extractedElements) throw ApiErrors.templateNotFound();

        // 2. Generate the buffer
        const templatePdfBuffer = await getPdfBufferFromUrl(activeTemplate.secureUrl);

        // 3. Generate PDF
        const pdfBuffer = await generatePdfFromTemplate(activeTemplate.extractedElements, finalData, {
            templatePdfBuffer: templatePdfBuffer
        });

        // 4. Define Local Folder and Filename
        const folder = `structurflow/transformed/${organizationId}`;
        const filename = `${uuidv4()}.pdf`;

        // 5. Upload directly to Supabase Storage
        const uploadResult = await storageService.uploadFile(pdfBuffer, folder, filename, 'application/pdf');

        // 6. Update the document with verified status and secure url while preserving processingDetails and storing updated data
        await documentRepository.updateById(documentId, {
            status: DocumentStatus.VERIFIED,
            processingDetails: {
                ...document.processingDetails,
                aiResponse: {
                    ...(document.processingDetails?.aiResponse || {}),
                    data: finalData,
                },
                publicId: uploadResult.public_id,
                secureUrl: uploadResult.secure_url,
            }
        });

        // 7. Log audit trail
        await auditLogRepository.create({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            actorId: new mongoose.Types.ObjectId(userId || document.uploadedById),
            documentId: document._id as mongoose.Types.ObjectId,
            projectId: document.projectId as mongoose.Types.ObjectId,
            action: AuditAction.DOCUMENT_VERIFIED,
            details: {
                filename: document.originalFileName,
                originalFileName: document.originalFileName,
                status: DocumentStatus.VERIFIED,
                url: uploadResult.secure_url,
                correctionsApplied: hasCorrections,
                correctedFieldsCount: hasCorrections ? Object.keys(correctedData!).length : 0,
            },
            ipAddress
        });

        // 8. Return the secure url
        return uploadResult.secure_url;
    }

    async getTransformedDocumentPreview(documentId: string, organizationId: string) {
        const document = await documentRepository.findByIdAndOrg(documentId, organizationId);
        if (!document) throw ApiErrors.documentNotFound();

        if ((document.status === DocumentStatus.VERIFIED || document.status === DocumentStatus.EXPORTED) && document.processingDetails?.secureUrl) {
            return { url: document.processingDetails.secureUrl, status: document.status };
        }

        if (!document.processingDetails?.aiResponse?.data) {
            throw ApiErrors.badRequest("Document has not been processed yet.");
        }

        // 1. Get document's project
        const activeTemplate = await templateRepository.activeTemplateByProject(document.projectId.toString(), organizationId);
        if (!activeTemplate || !activeTemplate.extractedElements) throw ApiErrors.templateNotFound();

        // 2. Generate the buffer
        const templatePdfBuffer = await getPdfBufferFromUrl(activeTemplate.secureUrl);

        // 3. Generate PDF
        const pdfBuffer = await generatePdfFromTemplate(activeTemplate.extractedElements, document.processingDetails.aiResponse.data, {
            templatePdfBuffer: templatePdfBuffer
        });

        // Convert Buffer to a base64 Data URL
        const previewPdf = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;

        return { url: previewPdf, status: document.status };
    }

    async getDocumentsList(
        projectId: string,
        optionsOrPage: DocumentQueryOptions | number = 1,
        limitArg?: number
    ) {
        if (typeof optionsOrPage === 'number') {
            return await documentRepository.findAllByProject(projectId, {
                page: optionsOrPage,
                limit: limitArg || 10
            });
        }
        return await documentRepository.findAllByProject(projectId, optionsOrPage);
    }

    async getOrganizationDocuments(organizationId: string, options: DocumentQueryOptions = {}) {
        return await documentRepository.findAllByOrganization(organizationId, options);
    }

    async getDocumentDetails(documentId: string, organizationId: string) {
        const document = await documentRepository.findByIdAndOrg(documentId, organizationId);
        if (!document) throw ApiErrors.documentNotFound();
        const auditTrail = await auditLogRepository.findByDocument(documentId);

        let templateHtml = null;
        if (document.projectId) {
            const activeTemplate = await templateRepository.activeTemplateByProject(document.projectId.toString(), organizationId);
            if (activeTemplate) {
                templateHtml = activeTemplate.htmlContent || null;
            }
        }

        return {
            document,
            auditTrail,
            templateHtml
        }
    }

    async bulkVerifyDocuments(documentIds: string[], organizationId: string, userId?: string) {
        if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
            throw ApiErrors.badRequest("Please provide an array of document IDs to verify.");
        }

        const successful: string[] = [];
        const failed: { id: string; error: string }[] = [];

        await Promise.allSettled(
            documentIds.map(async (id) => {
                try {
                    await this.verifyDocument(id, organizationId, userId);
                    successful.push(id);
                } catch (err: any) {
                    failed.push({
                        id,
                        error: err?.message || "Verification failed"
                    });
                }
            })
        );

        return { successful, failed, total: documentIds.length };
    }

    async rejectDocument(documentId: string, organizationId: string, reason?: string, userId?: string, ipAddress?: string) {
        const document = await documentRepository.findByIdAndOrg(documentId, organizationId);
        if (!document) throw ApiErrors.documentNotFound();

        await documentRepository.updateById(documentId, { status: DocumentStatus.REJECTED });
        await auditLogRepository.create({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            actorId: new mongoose.Types.ObjectId(userId || document.uploadedById),
            documentId: document._id as mongoose.Types.ObjectId,
            projectId: document.projectId as mongoose.Types.ObjectId,
            action: AuditAction.DOCUMENT_REJECTED,
            details: {
                filename: document.originalFileName,
                originalFileName: document.originalFileName,
                status: DocumentStatus.REJECTED,
                reason: reason || "Rejected by reviewer during verification"
            },
            ipAddress
        });

        return { success: true, documentId, status: DocumentStatus.REJECTED };
    }

    async updateDocumentStatus(documentId: string, organizationId: string, status: DocumentStatus, userId?: string, ipAddress?: string) {
        const document = await documentRepository.findByIdAndOrg(documentId, organizationId);
        if (!document) throw ApiErrors.documentNotFound();

        const fromStatus = document.status;
        await documentRepository.updateById(documentId, { status });
        await auditLogRepository.create({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            actorId: new mongoose.Types.ObjectId(userId || document.uploadedById),
            documentId: document._id as mongoose.Types.ObjectId,
            projectId: document.projectId as mongoose.Types.ObjectId,
            action: status === DocumentStatus.EXPORTED
                ? AuditAction.DOCUMENT_STATUS_CHANGED
                : status === DocumentStatus.VERIFIED
                ? AuditAction.DOCUMENT_VERIFIED
                : AuditAction.DOCUMENT_REJECTED,
            details: {
                filename: document.originalFileName,
                originalFileName: document.originalFileName,
                fromStatus,
                toStatus: status,
                status,
            },
            ipAddress
        });

        return document.processingDetails?.secureUrl || document.secureUrl;
    }

    async updateStatus(documentId: string, organizationId: string, status: DocumentStatus, userId?: string, ipAddress?: string) {
        return this.updateDocumentStatus(documentId, organizationId, status, userId, ipAddress);
    }

    async deleteDocument(documentId: string, organizationId: string, userId: string, ipAddress?: string) {
        const document = await documentRepository.findByIdAndOrg(documentId, organizationId);
        if (!document) throw ApiErrors.documentNotFound();

        await documentRepository.softDeleteById(documentId);

        await auditLogRepository.create({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            actorId: new mongoose.Types.ObjectId(userId),
            documentId: document._id as mongoose.Types.ObjectId,
            projectId: document.projectId as mongoose.Types.ObjectId,
            action: AuditAction.DOCUMENT_DELETED,
            details: {
                filename: document.originalFileName,
                originalFileName: document.originalFileName,
                status: "DELETED"
            },
            ipAddress
        });

        return { success: true };
    }

    async getDocumentSummary(projectId: string) {
        return await documentRepository.getSummaryByProject(projectId);
    }
}

const documentService = new DocumentService();
export default documentService;