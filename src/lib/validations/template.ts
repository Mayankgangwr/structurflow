import { z } from "zod";

export const MAX_TEMPLATE_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const ALLOWED_TEMPLATE_MIME_TYPES = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const processTemplateSchema = z.object({
    templateId: z.string().min(1, "Template ID is required"),
});

export type ProcessTemplateInput = z.infer<typeof processTemplateSchema>;

export const setActiveTemplateSchema = z.object({
    projectId: z.string().min(1, "Project ID is required"),
});

export type SetActiveTemplateInput = z.infer<typeof setActiveTemplateSchema>;

export class TemplateValidationError extends Error {
    constructor(
        message: string,
        public code: string = "VALIDATION_ERROR",
        public statusCode: number = 400
    ) {
        super(message);
        this.name = "TemplateValidationError";
        Object.setPrototypeOf(this, TemplateValidationError.prototype);
    }
}

export function validateTemplateUpload(file: unknown, projectId: unknown): { file: File; projectId: string } {
    if (!(file instanceof File)) {
        throw new TemplateValidationError("A template file is required.", "FILE_REQUIRED", 400);
    }

    if (typeof projectId !== "string" || !projectId.trim()) {
        throw new TemplateValidationError("projectId is required.", "PROJECT_ID_REQUIRED", 400);
    }

    if (!ALLOWED_TEMPLATE_MIME_TYPES.has(file.type)) {
        throw new TemplateValidationError(
            "Unsupported file type. Upload a PDF, JPG, PNG, or DOCX file.",
            "UNSUPPORTED_FILE_TYPE",
            400
        );
    }

    if (file.size === 0 || file.size > MAX_TEMPLATE_FILE_SIZE) {
        throw new TemplateValidationError(
            "Template file must be between 1 byte and 25 MB.",
            "INVALID_FILE_SIZE",
            400
        );
    }

    return { file, projectId: projectId.trim() };
}
