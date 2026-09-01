import { storageService } from "@/integrations/storage.service";
import { TemplateStatus } from "@/models/template.model";
import { AuditAction } from "@/models/audit-log.model";
import auditLogRepository from "@/repositories/audit-log.repository";
import templateRepository from "@/repositories/template.repository";
import projectRepository from "@/repositories/project.repository";
import { ApiErrors, DomainError } from "@/utils/errors";
import { enqueueTemplateParse } from "@/jobs/document.queue";
import crypto from "crypto";
import path from "path";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

class TemplateService {

    async uploadTemplate(
        file: Express.Multer.File,
        organizationId: string,
        projectId: string,
        userId: string,
        ipAddress?: string
    ) {
        const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');
        const duplicateCount = await templateRepository.countByOrgAndHash(organizationId, fileHash);
        const isDuplicate = duplicateCount > 0;

        const folder = `structurflow/${organizationId}/templates`;
        const extension = path.extname(file.originalname);
        const filename = `${uuidv4()}${extension}`;

        const uploadResult = await storageService.uploadFile(file.buffer, folder, filename, file.mimetype);

        try {
            const template = await templateRepository.create({
                organizationId: new mongoose.Types.ObjectId(organizationId),
                projectId: new mongoose.Types.ObjectId(projectId),
                uploadedById: new mongoose.Types.ObjectId(userId),
                originalFileName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                fileHash,
                publicId: uploadResult.public_id,
                secureUrl: uploadResult.secure_url,
                status: TemplateStatus.UPLOADED,
            });

            // Set this as the active template on the project
            await projectRepository.updateTemplate(projectId, template._id as mongoose.Types.ObjectId);

            await auditLogRepository.create({
                organizationId: new mongoose.Types.ObjectId(organizationId),
                actorId: new mongoose.Types.ObjectId(userId),
                documentId: template._id as mongoose.Types.ObjectId,
                action: AuditAction.DOCUMENT_UPLOADED,
                details: {
                    filename: file.originalname,
                    size: file.size,
                    type: 'TEMPLATE',
                    isDuplicateWarning: isDuplicate
                },
                ipAddress
            });

            // Enqueue background job to parse the template into a Target Schema
            await enqueueTemplateParse(template._id.toString(), projectId);

            return {
                document: template,
                warnings: isDuplicate ? ['An identical template file has been uploaded previously.'] : []
            };
        } catch (error: any) {
            storageService.deleteFile(uploadResult.public_id).catch(() => { });
            if (error instanceof DomainError) throw error;
            throw new Error(`Failed to save template record: ${error.message}`);
        }
    }

    async getByProject(projectId: string) {
        return templateRepository.findByProject(projectId);
    }

    async getActiveByProject(projectId: string, organizationId: string) {
        const project = await projectRepository.findByIdAndOrg(projectId, organizationId);
        if (!project) throw ApiErrors.projectNotFound();

        if (!project.templateDocumentId) return null;

        return templateRepository.findByIdAndOrg(
            project.templateDocumentId.toString(),
            organizationId
        );
    }

    async getById(templateId: string, organizationId: string) {
        const template = await templateRepository.findByIdAndOrg(templateId, organizationId);
        if (!template) throw ApiErrors.templateNotFound();
        return template;
    }

    async deleteTemplate(templateId: string, organizationId: string, userId: string) {
        const template = await templateRepository.findByIdAndOrg(templateId, organizationId);
        if (!template) throw ApiErrors.templateNotFound();

        await templateRepository.softDeleteById(templateId);

        // If it was the active template, nullify it
        const project = await projectRepository.findByIdAndOrg(
            template.projectId.toString(),
            organizationId
        );
        if (project?.templateDocumentId?.toString() === templateId) {
            await projectRepository.updateTemplate(project._id.toString(), null as any);
        }

        await auditLogRepository.create({
            organizationId: new mongoose.Types.ObjectId(organizationId),
            actorId: new mongoose.Types.ObjectId(userId),
            documentId: template._id as mongoose.Types.ObjectId,
            action: AuditAction.DOCUMENT_DELETED,
            details: { filename: template.originalFileName, type: 'TEMPLATE' }
        });

        return { success: true };
    }
}

const templateService = new TemplateService();
export default templateService;
