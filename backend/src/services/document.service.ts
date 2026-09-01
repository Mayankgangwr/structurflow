import { storageService } from "@/integrations/storage.service";
import { AuditAction } from "@/models/audit-log.model";
import { DocumentStatus } from "@/models/document.model";
import auditLogRepository from "@/repositories/audit-log.repository";
import documentRepository from "@/repositories/document.repository";
import projectRepository from "@/repositories/project.repository";
import { ApiErrors, DomainError } from "@/utils/errors";
import crypto from "crypto";
import path from "path";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
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

    async getDocumentsList(projectId: string, page = 1, limit = 50) {
        const skip = (page - 1) * limit;

        return await documentRepository.findAllByProject(projectId, limit, skip);
    }

    async getDocumentDetails(documentId: string, organizationId: string) {
        const document = await documentRepository.findByIdAndOrg(documentId, organizationId);
        if (!document) throw ApiErrors.documentNotFound();
        const auditTrail = await auditLogRepository.findByDocument(documentId);

        return { document, auditTrail }
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