import { storageService } from "@/integrations/storage.service";
import { AuditAction } from "@/models/audit-log.model";
import { DocumentStatus } from "@/models/document.model";
import auditLogRepository from "@/repositories/audit-log.repository";
import documentRepository, { DocumentQueryOptions } from "@/repositories/document.repository";
import { ApiErrors, DomainError } from "@/utils/errors";
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

        // Extract the text from the pdf doc
        const rawText = await pdfService.extractTextFromPdf(file.buffer);

        // Then you can store 'rawText' in your database!


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
                action: AuditAction.DOCUMENT_UPLOADED,
                details: {
                    filename: file.originalname,
                    size: file.size,
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

    async proccessDocument(documentId: string, organizationId: string,) {
        // Get document
        const document = await documentRepository.findById(documentId);
        if (!document) throw ApiErrors.documentNotFound();

        // Get document's project
        const activeTemplate = await templateRepository.activeTemplateByProject(document.projectId.toString(), organizationId);
        if (!activeTemplate) throw ApiErrors.templateNotFound();

        const extractedData = document.extractedData;
        const schema = activeTemplate.templateSchema;

        if (!extractedData || !schema) throw ApiErrors.documentNotFound();

        const LLMResult = await pdfService.processPdfWithSchema(extractedData, schema.fields);

        await documentRepository.updateById(documentId, {
            status: DocumentStatus.TRANSFORMED,
            processingDetails: { aiResponse: LLMResult }
        });

        return LLMResult;
    }

    async verifyDocument(documentId: string, organizationId: string, userId?: string) {
        const document = await documentRepository.findByIdAndOrg(documentId, organizationId);
        if (!document) {
            throw ApiErrors.documentNotFound();
        }

        // If already verified or exported and secureUrl already exists, return it directly
        if (
            (document.status === DocumentStatus.VERIFIED || document.status === DocumentStatus.EXPORTED) &&
            document.processingDetails?.secureUrl
        ) {
            return document.processingDetails.secureUrl;
        }

        // Extracted data must exist to generate the verified document
        if (!document.processingDetails?.aiResponse?.data) {
            if (document.status === DocumentStatus.UPLOADED) {
                throw ApiErrors.badRequest("Document has not been processed yet. Please transform the document first.");
            }
            throw ApiErrors.badRequest(`Document cannot be verified because extracted data is missing (current status: ${document.status}).`);
        }

        // 1. Get document's project active template
        const activeTemplate = await templateRepository.activeTemplateByProject(document.projectId.toString(), organizationId);
        if (!activeTemplate || !activeTemplate.extractedElements) throw ApiErrors.templateNotFound();

        // 2. Generate the buffer
        const templatePdfBuffer = await getPdfBufferFromUrl(activeTemplate.secureUrl);

        // 3. Generate PDF
        const pdfBuffer = await generatePdfFromTemplate(activeTemplate.extractedElements, document.processingDetails.aiResponse.data, {
            templatePdfBuffer: templatePdfBuffer
        });

        // 4. Define Local Folder and Filename
        const folder = `structurflow/transformed/${organizationId}`;
        const filename = `${uuidv4()}.pdf`;

        // 5. Upload directly to Supabase Storage
        const uploadResult = await storageService.uploadFile(pdfBuffer, folder, filename, 'application/pdf');

        // 6. Update the document with verified status and secure url while preserving processingDetails
        await documentRepository.updateById(documentId, {
            status: DocumentStatus.VERIFIED,
            processingDetails: {
                ...document.processingDetails,
                publicId: uploadResult.public_id,
                secureUrl: uploadResult.secure_url,
            }
        });

        // 7. Log audit trail
        await auditLogRepository.create({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            actorId: new mongoose.Types.ObjectId(userId || document.uploadedById),
            documentId: document._id as mongoose.Types.ObjectId,
            action: AuditAction.DOCUMENT_VERIFIED,
            details: {
                filename: document.originalFileName,
                url: uploadResult.secure_url
            }
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

    async rejectDocument(documentId: string, organizationId: string, reason?: string, userId?: string) {
        const document = await documentRepository.findByIdAndOrg(documentId, organizationId);
        if (!document) throw ApiErrors.documentNotFound();

        await documentRepository.updateById(documentId, { status: DocumentStatus.REJECTED });
        await auditLogRepository.create({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            actorId: new mongoose.Types.ObjectId(userId || document.uploadedById),
            documentId: document._id as mongoose.Types.ObjectId,
            action: AuditAction.DOCUMENT_REJECTED,
            details: {
                filename: document.originalFileName,
                reason: reason || "Rejected by reviewer during verification"
            }
        });

        return { success: true, documentId, status: DocumentStatus.REJECTED };
    }

    async updateDocumentStatus(documentId: string, organizationId: string, status: DocumentStatus, userId?: string) {
        const document = await documentRepository.findByIdAndOrg(documentId, organizationId);
        if (!document) throw ApiErrors.documentNotFound();

        await documentRepository.updateById(documentId, { status });
        await auditLogRepository.create({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            actorId: new mongoose.Types.ObjectId(userId || document.uploadedById),
            documentId: document._id as mongoose.Types.ObjectId,
            action: status === DocumentStatus.EXPORTED ? AuditAction.DOCUMENT_STATUS_CHANGED : AuditAction.DOCUMENT_REJECTED,
            details: {
                filename: document.originalFileName
            }
        });

        return document.processingDetails.secureUrl;
    }

    async updateStatus(documentId: string, organizationId: string, status: DocumentStatus, userId?: string) {
        return this.updateDocumentStatus(documentId, organizationId, status, userId);
    }

    async deleteDocument(documentId: string, organizationId: string, userId: string) {
        const document = await documentRepository.findByIdAndOrg(documentId, organizationId);
        if (!document) throw ApiErrors.documentNotFound();

        await documentRepository.softDeleteById(documentId);

        await auditLogRepository.create({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            actorId: new mongoose.Types.ObjectId(userId),
            documentId: document._id as mongoose.Types.ObjectId,
            action: AuditAction.DOCUMENT_DELETED,
            details: {
                filename: document.originalFileName
            }
        });

        return { success: true };
    }

    async getDocumentSummary(projectId: string) {
        return await documentRepository.getSummaryByProject(projectId);
    }
}

const documentService = new DocumentService();
export default documentService;