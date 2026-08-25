import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiErrors } from "@/utils/errors";
import documentService from "@/services/document.service";
import documentRepository from "@/repositories/document.repository";
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

        const result = await documentService.uploadDocument(
            file,
            organizationId,
            projectId,
            userId,
            'TEMPLATE', // FORCE type
            ipAddress
        );

        return ok(res, result, "Template uploaded successfully");
    }),

    // GET /api/v1/templates/project/:projectId
    listByProject: asyncHandler(async (req: Request, res: Response) => {
        const projectId = req.params.projectId as string;
        if (!projectId) throw ApiErrors.missingRequiredField('Project Id');

        // We could also ensure the project belongs to the org
        const templates = await documentRepository.findByProjectAndType(projectId, 'TEMPLATE');

        return ok(res, templates, "Templates fetched successfully");
    }),

    // GET /api/v1/templates
    listByOrg: asyncHandler(async (req: Request, res: Response) => {
        const organizationId = req.headers['x-organization-id'] as string;
        const limit = Number(req.query.limit) || 50;
        const skip = Number(req.query.skip) || 0;

        // Find all templates for this org
        const templates = await documentRepository.findAllByOrg(organizationId, limit, skip);

        return ok(res, templates, "Organization templates fetched successfully");
    }),

    // GET /api/v1/templates/project/:projectId/active
    getActiveByProject: asyncHandler(async (req: Request, res: Response) => {
        const projectId = req.params.projectId as string;
        const organizationId = req.headers['x-organization-id'] as string;

        if (!projectId) throw ApiErrors.missingRequiredField('Project Id');

        const project = await projectRepository.findByIdAndOrg(projectId, organizationId);
        if (!project) throw ApiErrors.templateNotFound();

        if (!project.templateDocumentId) {
            return ok(res, null, "No active template set for this project");
        }

        const template = await documentRepository.findByIdAndOrg(project.templateDocumentId.toString(), organizationId);
        return ok(res, template, "Active template fetched successfully");
    }),

    // GET /api/v1/templates/:id
    getOne: asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const organizationId = req.headers['x-organization-id'] as string;

        if (!id) throw ApiErrors.missingRequiredField('Template Id');

        const details = await documentService.getDocumentDetails(id, organizationId);

        // Ensure it's actually a template
        if (details.document.documentType !== 'TEMPLATE') {
            throw ApiErrors.templateNotFound();
        }

        return ok(res, details, "Template fetched successfully");
    }),

    // PUT /api/v1/templates/:id/active
    setActive: asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const organizationId = req.headers['x-organization-id'] as string;

        if (!id) throw ApiErrors.missingRequiredField('Template Id');
        const { projectId } = req.body;
        if (!projectId) throw ApiErrors.missingRequiredField('projectId');

        // Verify the template exists and belongs to the org/project
        const template = await documentRepository.findByIdAndOrg(id, organizationId);
        if (!template || template.documentType !== 'TEMPLATE' || template.projectId.toString() !== projectId) {
            throw ApiErrors.templateNotFound();
        }

        await projectRepository.updateTemplate(projectId, new mongoose.Types.ObjectId(id));

        return ok(res, { success: true }, "Active template updated successfully");
    }),

    // DELETE /api/v1/templates/:id
    delete: asyncHandler(async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const organizationId = req.headers['x-organization-id'] as string;
        const userId = req.user?._id as string;

        if (!id) throw ApiErrors.missingRequiredField('Template Id');

        const template = await documentRepository.findByIdAndOrg(id, organizationId);
        if (!template || template.documentType !== 'TEMPLATE') {
            throw ApiErrors.templateNotFound();
        }

        await documentService.deleteDocument(id, organizationId, userId);

        return ok(res, { success: true }, "Template deleted successfully");
    }),
};
