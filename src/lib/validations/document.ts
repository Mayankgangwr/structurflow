import { z } from "zod";

export const MAX_DOCUMENT_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const MAX_DOCUMENT_FILES_COUNT = 10;

export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export class DocumentValidationError extends Error {
    constructor(
        message: string,
        public code: string = "VALIDATION_ERROR",
        public statusCode: number = 400
    ) {
        super(message);
        this.name = "DocumentValidationError";
        Object.setPrototypeOf(this, DocumentValidationError.prototype);
    }
}

export const processDocumentSchema = z.object({
    documentId: z.string().min(1, "documentId is required"),
});

export const verifyDocumentSchema = z.object({
    data: z.record(z.string(), z.any()).optional(),
    correctedData: z.record(z.string(), z.any()).optional(),
    status: z.string().optional(),
});

export const bulkVerifyDocumentsSchema = z.object({
    documentIds: z.array(z.string().min(1)).min(1, "documentIds array cannot be empty"),
});

export const rejectDocumentSchema = z.object({
    reason: z.string().optional(),
});

export const updateDocumentStatusSchema = z.object({
    status: z.string().default("EXPORTED"),
});

export const documentQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
    search: z.string().optional(),
    status: z.string().optional(),
    projectId: z.string().optional(),
    sortBy: z.enum(["createdAt", "name", "size", "status"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type ProcessDocumentInput = z.infer<typeof processDocumentSchema>;
export type VerifyDocumentInput = z.infer<typeof verifyDocumentSchema>;
export type BulkVerifyDocumentsInput = z.infer<typeof bulkVerifyDocumentsSchema>;
export type RejectDocumentInput = z.infer<typeof rejectDocumentSchema>;
export type UpdateDocumentStatusInput = z.infer<typeof updateDocumentStatusSchema>;
export type DocumentQueryInput = z.infer<typeof documentQuerySchema>;

/**
 * Validates uploaded files from FormData
 */
export function validateDocumentUpload(files: unknown[], projectId: unknown): { files: File[]; projectId: string } {
    if (typeof projectId !== "string" || !projectId.trim()) {
        throw new DocumentValidationError("projectId is required.", "PROJECT_ID_REQUIRED", 400);
    }

    if (!Array.isArray(files) || files.length === 0) {
        throw new DocumentValidationError("At least one valid file is required.", "FILES_REQUIRED", 400);
    }

    if (files.length > MAX_DOCUMENT_FILES_COUNT) {
        throw new DocumentValidationError(
            `Cannot upload more than ${MAX_DOCUMENT_FILES_COUNT} files at once.`,
            "TOO_MANY_FILES",
            400
        );
    }

    const validatedFiles: File[] = [];

    for (const item of files) {
        if (!(item instanceof File) || item.size === 0) {
            continue;
        }

        if (item.size > MAX_DOCUMENT_FILE_SIZE) {
            throw new DocumentValidationError(
                `File "${item.name}" exceeds the 50MB limit.`,
                "FILE_TOO_LARGE",
                400
            );
        }

        if (item.type && !ALLOWED_DOCUMENT_MIME_TYPES.has(item.type)) {
            const ext = item.name.split(".").pop()?.toLowerCase();
            const allowedExts = ["pdf", "jpg", "jpeg", "png", "webp", "txt", "docx"];
            if (!ext || !allowedExts.includes(ext)) {
                throw new DocumentValidationError(
                    `File "${item.name}" has an unsupported format. Allowed: PDF, PNG, JPG, WEBP, TXT, DOCX.`,
                    "UNSUPPORTED_FILE_TYPE",
                    400
                );
            }
        }

        validatedFiles.push(item);
    }

    if (validatedFiles.length === 0) {
        throw new DocumentValidationError("At least one valid file is required.", "FILES_REQUIRED", 400);
    }

    return { files: validatedFiles, projectId: projectId.trim() };
}
