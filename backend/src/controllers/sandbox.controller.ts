import { Request, Response, NextFunction } from "express";
import { ok } from "@/utils/response";
import { logger } from "@/utils/logger";
import sandboxService from "@/services/sandbox.service";
import { ApiErrors } from "@/utils/errors";

export class SandboxController {
    /**
     * GET /api/v1/sandbox/presets
     * Returns the list of bundled sample templates for quick testing
     */
    async getPresets(req: Request, res: Response, next: NextFunction) {
        try {
            const presets = sandboxService.getPresets();
            return ok(res, presets, "Sandbox presets fetched successfully");
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/sandbox/transform
     * Ephemeral guest transformation endpoint (0 database writes)
     */
    async transform(req: Request, res: Response, next: NextFunction) {
        try {
            const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
            const documentFile = files?.["document"]?.[0];
            const templateFile = files?.["template"]?.[0];
            const presetId = req.body?.presetId as string | undefined;

            if (!documentFile) {
                throw ApiErrors.badRequest("A raw document file (PDF, PNG, or JPEG) is required for transformation.");
            }

            // Must have either a template file or a valid presetId
            if (!templateFile && !presetId) {
                throw ApiErrors.badRequest("Please provide either a custom template PDF or select a preset template.");
            }

            // Allowed MIME types
            const allowedDocTypes = [
                "application/pdf",
                "image/png",
                "image/jpeg",
                "image/jpg",
                "image/webp",
                "text/plain"
            ];

            if (!allowedDocTypes.includes(documentFile.mimetype)) {
                throw ApiErrors.badRequest("Invalid document type. Please upload a PDF or an image file (PNG, JPEG, WEBP).");
            }

            if (templateFile && templateFile.mimetype !== "application/pdf") {
                throw ApiErrors.badRequest("Templates must be in PDF format with structured text layout.");
            }

            const result = await sandboxService.transformEphemeral({
                rawDocumentBuffer: documentFile.buffer,
                rawDocumentMimeType: documentFile.mimetype,
                rawDocumentName: documentFile.originalname,
                templateBuffer: templateFile?.buffer,
                templateMimeType: templateFile?.mimetype,
                presetId: presetId || undefined
            });

            return ok(res, result, "Document transformed successfully in ephemeral sandbox");
        } catch (error) {
            next(error);
        }
    }
}

export const sandboxController = new SandboxController();
export default sandboxController;
