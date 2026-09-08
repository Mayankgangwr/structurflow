import { Request, Response } from 'express';
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiErrors } from '@/utils/errors';
import projectService from '@/services/project.service';
import { ok } from '@/utils/response';
import { formatRelativeTime } from '@/utils/date.utils';

export const projectController = {
    create: asyncHandler(async (req: Request, res: Response) => {
        const { name, description } = req.body;
        if (!name) throw ApiErrors.missingRequiredField('name');

        const orgId = req.headers['x-organization-id'] as string;
        if (!orgId) throw ApiErrors.orgIdRequired();

        const userId = req.user!._id;

        const project = await projectService.createProject(name, description, orgId, userId);
        return ok(res, project, "Project created successfully", 201);
    }),

    list: asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.headers['x-organization-id'] as string;
        if (!orgId) throw ApiErrors.orgIdRequired();

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = (req.query.search as string) || "";
        const status = (req.query.status as string) || "ALL";
        const sortBy = (req.query.sortBy as string) || "lastActivity";
        const sortOrder = (req.query.sortOrder as string) === "asc" ? "asc" : "desc";

        const result = await projectService.getProjectsByOrg(orgId, {
            page,
            limit,
            search,
            status,
            sortBy,
            sortOrder
        });

        const formattedProjects = result.projects.map((p: any) => ({
            id: p._id.toString(),
            name: p.name,
            description: p.description || "",
            status: "Active",
            documents: p.documents || 0,
            processing: p.processing || 0,
            needsVerification: p.needsVerification || 0,
            successRate: p.successRate || 0,
            lastActivity: formatRelativeTime(new Date(p.lastActivityDate || p.updatedAt).toISOString()),
            activeTemplateId: p.templateDocumentId ? p.templateDocumentId.toString() : null
        }));

        return ok(res, {
            projects: formattedProjects,
            pagination: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages
            },
            meta: {
                totalProjects: result.totalProjects,
                totalPendingVerification: result.totalPendingVerification
            }
        }, "Projects fetched successfully");
    }),

    getById: asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        if (!id) throw ApiErrors.missingRequiredField('Project Id');
        const p = await projectService.getById(id);

        const formattedProject = {
            id: p._id.toString(),
            name: p.name,
            description: p.description || "",
            status: "Active",
            documents: p.documents || 0,
            processing: p.processing || 0,
            needsVerification: p.needsVerification || 0,
            successRate: p.successRate || 0,
            lastActivity: formatRelativeTime(new Date(p.lastActivityDate || p.updatedAt).toISOString()),
            activeTemplateId: p.templateDocumentId ? (p.templateDocumentId as any)._id?.toString() || p.templateDocumentId.toString() : null,
            templateData: p.templateData || (p.templateDocumentId && (p.templateDocumentId as any)._id ? p.templateDocumentId : null)
        };

        return ok(res, formattedProject, "Project fetched successfully");
    }),

    updateById: asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        if (!id) throw ApiErrors.missingRequiredField('Project Id');
        const { name, description } = req.body;
        const project = await projectService.updateById(id, name, description);
        return ok(res, project, "Project updated successfully");
    }),

    delete: asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        if (!id) throw ApiErrors.missingRequiredField('Project Id');
        const project = await projectService.deleteProject(id);
        return ok(res, project, "Project deleted successfully");
    })
}
