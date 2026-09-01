import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiErrors } from '@/utils/errors';
import documentService from '@/services/document.service';
import { pdfRendererService } from '@/services/pdf-renderer.service';
import { Template } from '@/models/template.model';
import { ok } from '@/utils/response';

export const documentController = {
    upload: asyncHandler(async (req: Request, res: Response) => {
        // Read multiple files
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) throw ApiErrors.missingRequiredField('files');

        const orgId = req.headers['x-organization-id'] as string;
        const { projectId } = req.body;
        if (!projectId) throw ApiErrors.missingRequiredField('projectId');

        const userId = req.user!._id;
        const ip = req.ip || req.socket.remoteAddress;

        // Upload all files concurrently
        const results = await Promise.all(
            files.map(file =>
                documentService.uploadDocument(file, orgId, projectId, userId, ip)
            )
        );

        return ok(res, results, "Documents uploaded successfully", 201);
    }),

    list: asyncHandler(async (req: Request, res: Response) => {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const projectId = req.params.projectId as string;

        const result = await documentService.getDocumentsList(projectId, page, limit);
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
    }),

    verify: asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.headers['x-organization-id'] as string;
        const docId = req.params.id as string;
        const userId = req.user!._id;
        const { verifiedData } = req.body;

        if (!verifiedData) throw ApiErrors.missingRequiredField('verifiedData');

        const result = await documentService.verifyDocument(docId, orgId, userId, verifiedData);
        return ok(res, result, 'Document verified successfully');
    }),

    retry: asyncHandler(async (req: Request, res: Response) => {
        const orgId = req.headers['x-organization-id'] as string;
        const docId = req.params.id as string;

        const doc = await documentService.getDocumentDetails(docId, orgId);
        if (!doc) throw ApiErrors.documentNotFound();

        const { enqueueDocumentProcess } = await import('@/jobs/document.queue');
        await enqueueDocumentProcess(docId, doc.document.projectId.toString());

        return ok(res, { success: true }, 'Document queued for reprocessing');
    }),

    /**
     * Reconstructs the document with structured data and exports it as a PDF
     */
    exportDocumentPdf: asyncHandler(async (req: Request, res: Response) => {
        const docId = req.params.id as string;
        
        // 1. Fetch document and template
        const doc = await documentService.getDocumentById(docId);
        if (!doc || !doc.verifiedData || !doc.templateId) {
            throw ApiErrors.notFound('Verified Document or Template not found');
        }

        const template = await Template.findById(doc.templateId);
        if (!template || !template.htmlTemplate) {
            throw ApiErrors.notFound('Template HTML not found');
        }

        // 2. Hydrate the HTML template with the verified data
        let hydratedHtml = template.htmlTemplate;
        const data = doc.verifiedData;

        // Simple string replacement for all {{key}} placeholders
        for (const [key, value] of Object.entries(data)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            hydratedHtml = hydratedHtml.replace(regex, String(value || ''));
        }

        // 3. Generate PDF using Puppeteer
        const pdfBuffer = await pdfRendererService.renderHtmlToPdf(hydratedHtml);

        // 4. Return as a downloadable stream
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${doc.name.split('.')[0]}_exported.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        res.status(200).send(pdfBuffer);
    })
};
