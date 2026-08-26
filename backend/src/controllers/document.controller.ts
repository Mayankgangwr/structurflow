import { Request, Response } from 'express';
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiErrors } from '@/utils/errors';
import documentService from '@/services/document.service';
import { ok } from '@/utils/response';
import { string } from 'zod';
export const documentController = {
    upload: asyncHandler(async (req: Request, res: Response) => {
        // Read multiple files
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) throw ApiErrors.missingRequiredField('files');

        const orgId = req.headers['x-organization-id'] as string;
        const { projectId, documentType = 'RAW' } = req.body;

        if (!projectId) throw ApiErrors.missingRequiredField('projectId');
        if (!documentType || !['TEMPLATE', 'RAW'].includes(documentType)) {
            throw ApiErrors.invalidDocumentType();
        }

        const userId = req.user!._id;
        const ip = req.ip || req.socket.remoteAddress;

        // Upload all files concurrently
        const results = await Promise.all(
            files.map(file =>
                documentService.uploadDocument(file, orgId, projectId, userId, documentType, ip)
            )
        );

        return ok(res, results, "Documents uploaded successfully", 201);
    }),


    list: asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const projectId = req.params.projectId as string;

        const result = await documentService.getDocumentsList(projectId, page, limit, "DOC");
        return ok(res, result, "Documents fetched successfully");
    }),

    summary: asyncHandler(async (req: Request, res: Response) => {
        const projectId = req.params.projectId as string;
        const summary = await documentService.getDocumentSummary(projectId);
        return ok(res, summary, "Documents summary fetched successfully");
    }),

    getOne: asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.headers['x-organization-id'] as string;
        const docId = req.params.id as string;

        const result = await documentService.getDocumentDetails(docId, orgId);

        return ok(res, result, 'Document details fetched successfully');
    })
}