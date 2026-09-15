export interface SandboxTransformInput {
    rawDocumentBuffer: Buffer;
    rawDocumentMimeType: string;
    rawDocumentName: string;
    templateBuffer: Buffer;
    templateMimeType: string;
    templateName: string;
}

export interface SandboxTransformResult {
    filename: string;
    pdfBase64: string;
    extractedFields: Record<string, any>;
    processingTimeMs: number;
    meta: {
        documentName: string;
        templateName: string;
        fieldCount: number;
        isPreset?: boolean;
    };
}

export const SANDBOX_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const SANDBOX_ALLOWED_DOCUMENT_TYPES = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "text/plain",
];

export const SANDBOX_ALLOWED_TEMPLATE_TYPES = [
    "application/pdf",
];
