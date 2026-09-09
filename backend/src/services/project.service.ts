import projectRepository, { ProjectQueryOptions } from "@/repositories/project.repository";
import auditLogRepository from "@/repositories/audit-log.repository";
import { AuditAction } from "@/models/audit-log.model";
import { ApiErrors } from "@/utils/errors";
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
                organizationId,
                actorId: userId,
                projectId: project._id,
                action: AuditAction.PROJECT_CREATED,
                details: {
                    projectName: project.name,
                    description: project.description,
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
                    organizationId,
                    actorId: userId,
                    projectId: project._id,
                    action: AuditAction.PROJECT_UPDATED,
                    details: {
                        projectName: project.name,
                        description: project.description,
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

        if (organizationId && userId) {
            try {
                await auditLogRepository.create({
                    organizationId,
                    actorId: userId,
                    projectId: project._id,
                    action: AuditAction.PROJECT_DELETED,
                    details: {
                        projectName: project.name,
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
