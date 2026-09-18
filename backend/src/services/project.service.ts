import projectRepository, { ProjectQueryOptions } from "@/repositories/project.repository";
import documentRepository from "@/repositories/document.repository";
import templateRepository from "@/repositories/template.repository";
import { storageService } from "@/integrations/storage.service";
import auditLogRepository from "@/repositories/audit-log.repository";
import { AuditAction } from "@/models/audit-log.model";
import { ApiErrors } from "@/utils/errors";
import { logger } from "@/utils/logger";
import mongoose from "mongoose";

class ProjectService {
    async createProject(name: string, description: string | undefined, organizationId: string, userId: string) {
        const project = await projectRepository.create({
            name,
            description,
            organizationId: new mongoose.Types.ObjectId(organizationId),
            createdById: new mongoose.Types.ObjectId(userId)
        });

        // Record Audit Log
        try {
            await auditLogRepository.create({
                organizationId: new mongoose.Types.ObjectId(organizationId),
                actorId: new mongoose.Types.ObjectId(userId),
                projectId: project._id as mongoose.Types.ObjectId,
                action: AuditAction.PROJECT_CREATED,
                details: {
                    projectName: project.name,
                    description: project.description,
                    status: "ACTIVE",
                },
            });
        } catch (err) {
            console.error("Failed to log PROJECT_CREATED:", err);
        }

        return project;
    }

    async getProjectsByOrg(organizationId: string, options: ProjectQueryOptions = {}) {
        return await projectRepository.findByOrg(organizationId, options);
    }

    async getById(id: string) {
        const project = await projectRepository.findByIdWithTemplate(id);
        if (!project) throw ApiErrors.projectNotFound();
        return project;
    }

    async updateById(id: string, name: string, description: string, organizationId?: string, userId?: string) {
        const project = await projectRepository.updateById(id, { name, description });
        if (!project) throw ApiErrors.projectNotFound();

        if (organizationId && userId) {
            try {
                await auditLogRepository.create({
                    organizationId: new mongoose.Types.ObjectId(organizationId),
                    actorId: new mongoose.Types.ObjectId(userId),
                    projectId: project._id as mongoose.Types.ObjectId,
                    action: AuditAction.PROJECT_UPDATED,
                    details: {
                        projectName: project.name,
                        description: project.description,
                        status: "UPDATED",
                    },
                });
            } catch (err) {
                console.error("Failed to log PROJECT_UPDATED:", err);
            }
        }

        return project;
    }

    async deleteProject(id: string, organizationId?: string, userId?: string) {
        const project = await projectRepository.softDelete(id);
        if (!project) throw ApiErrors.projectNotFound();

        // 1. Cascade soft-delete all related documents & templates
        const [deletedDocsResult, deletedTemplatesResult] = await Promise.all([
            documentRepository.softDeleteByProject(id, organizationId),
            templateRepository.softDeleteByProject(id, organizationId),
        ]);

        logger.info(
            `Project ${id} cascade deleted: ${deletedDocsResult.modifiedCount} documents, ${deletedTemplatesResult.modifiedCount} templates`
        );

        // 2. Asynchronously clean up storage files from Supabase Storage
        (async () => {
            try {
                const [docs, templates] = await Promise.all([
                    documentRepository.findByProject(id, organizationId),
                    templateRepository.findByProject(id, organizationId),
                ]);

                for (const doc of docs) {
                    if (doc.publicId) {
                        storageService.deleteFile(doc.publicId).catch(() => {});
                    }
                }

                for (const tmpl of templates) {
                    if (tmpl.publicId) {
                        storageService.deleteFile(tmpl.publicId).catch(() => {});
                    }
                }
            } catch (storageErr) {
                logger.warn(`Storage file cleanup error during cascade delete for project ${id}:`, storageErr);
            }
        })();

        // 3. Record Audit Log
        if (organizationId && userId) {
            try {
                await auditLogRepository.create({
                    organizationId: new mongoose.Types.ObjectId(organizationId),
                    actorId: new mongoose.Types.ObjectId(userId),
                    projectId: project._id as mongoose.Types.ObjectId,
                    action: AuditAction.PROJECT_DELETED,
                    details: {
                        projectName: project.name,
                        status: "DELETED",
                        deletedDocumentsCount: deletedDocsResult.modifiedCount,
                        deletedTemplatesCount: deletedTemplatesResult.modifiedCount,
                    },
                });
            } catch (err) {
                console.error("Failed to log PROJECT_DELETED:", err);
            }
        }

        return project;
    }
}

const projectService = new ProjectService();
export default projectService;
