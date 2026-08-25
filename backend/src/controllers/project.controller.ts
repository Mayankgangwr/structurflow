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

        const projects = await projectService.getProjectsByOrg(orgId);

        const formattedProjects = projects.map(p => ({
            id: p._id.toString(),
            name: p.name,
            description: p.description || "",
            status: "Active",
            documents: 0,
            processing: 0,
            needsVerification: 0,
            successRate: 0,
            lastActivity: formatRelativeTime(p.updatedAt.toISOString())
        }));

        return ok(res, formattedProjects, "Projects fetched successfully");
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
            documents: 0,
            processing: 0,
            needsVerification: 0,
            successRate: 0,
            lastActivity: formatRelativeTime(p.updatedAt.toISOString())
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
