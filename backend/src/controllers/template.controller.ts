import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiErrors } from "@/utils/errors";
import templateService from "@/services/template.service";
import templateRepository from "@/repositories/template.repository";
import projectRepository from "@/repositories/project.repository";
import mongoose from "mongoose";
import { ok } from "@/utils/response";

export const templateController = {

    // POST /api/v1/templates
    upload: asyncHandler(async (req: Request, res: Response) => {
        const file = req.file;
        if (!file) throw ApiErrors.missingRequiredField('Template file');

        const { projectId } = req.body;
        if (!projectId) throw ApiErrors.missingRequiredField('projectId');

        const organizationId = req.headers['x-organization-id'] as string;
        const userId = req.user?._id as string;
        const ipAddress = req.ip || req.connection.remoteAddress;

        const result = await templateService.uploadTemplate(
            file, organizationId, projectId, userId, ipAddress
        );

        return ok(res, result, "Template uploaded successfully");
    }),

    // GET /api/v1/templates/project/:projectId
    listByProject: asyncHandler(async (req: Request, res: Response) => {
        const projectId = req.params.projectId as string;
        if (!projectId) throw ApiErrors.missingRequiredField('Project Id');

        const templates = await templateService.getByProject(projectId);
        return ok(res, templates, "Templates fetched successfully");
    }),

    // GET /api/v1/templates
    listByOrg: asyncHandler(async (req: Request, res: Response) => {
        const organizationId = req.headers['x-organization-id'] as string;
        const limit = Number(req.query.limit) || 50;
        const skip = Number(req.query.skip) || 0;

        const templates = await templateRepository.findByOrg(organizationId, limit, skip);
        return ok(res, templates, "Organization templates fetched successfully");
    }),

    // GET /api/v1/templates/project/:projectId/active
    getActiveByProject: asyncHandler(async (req: Request, res: Response) => {
        const projectId = req.params.projectId as string;
        const organizationId = req.headers['x-organization-id'] as string;
        if (!projectId) throw ApiErrors.missingRequiredField('Project Id');

        const template = await templateService.getActiveByProject(projectId, organizationId);
        return ok(res, template, template ? "Active template fetched" : "No active template");
    }),

    // GET /api/v1/templates/:id
    getOne: asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const organizationId = req.headers['x-organization-id'] as string;
        if (!id) throw ApiErrors.missingRequiredField('Template Id');

        const template = await templateService.getById(id, organizationId);
        return ok(res, template, "Template fetched successfully");
    }),

    // PUT /api/v1/templates/:id/active
    setActive: asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const organizationId = req.headers['x-organization-id'] as string;
        if (!id) throw ApiErrors.missingRequiredField('Template Id');

        const { projectId } = req.body;
        if (!projectId) throw ApiErrors.missingRequiredField('projectId');

        const template = await templateRepository.findByIdAndOrg(id, organizationId);
        if (!template || template.projectId.toString() !== projectId) {
            throw ApiErrors.templateNotFound();
        }

        await projectRepository.updateTemplate(projectId, new mongoose.Types.ObjectId(id));
        return ok(res, { success: true }, "Active template updated");
    }),

    // DELETE /api/v1/templates/:id
    delete: asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const organizationId = req.headers['x-organization-id'] as string;
        const userId = req.user?._id as string;
        if (!id) throw ApiErrors.missingRequiredField('Template Id');

        await templateService.deleteTemplate(id, organizationId, userId);
        return ok(res, { success: true }, "Template deleted successfully");
    }),
};
