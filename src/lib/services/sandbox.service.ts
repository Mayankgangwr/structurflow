import path from "path";
import extractPdfElements from "@/utils/extractPdfElements";
import generatePdfFromTemplate from "@/utils/generatePdfFromTemplate";
import { aiService } from "@/lib/services/ai.service";
import { documentService } from "@/lib/services/document.service";
import type {
    SandboxTransformInput,
    SandboxTransformResult,
} from "@/lib/validations/sandbox";

export class SandboxServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400
    ) {
        super(message);
        this.name = "SandboxServiceError";
    }
}

export class SandboxService {
    /**
     * Pure in-memory transformation pipeline:
     * 1. Extracts visual layout elements and AST from template PDF
     * 2. Identifies variable placeholders & schema via AI
     * 3. Extracts raw document text/image content via OCR
     * 4. Maps document text into template schema via Gemini AI
     * 5. Compiles transformed PDF buffer in volatile RAM
     * 6. Returns base64 output with ZERO database or cloud storage writes
     */
    async transformEphemeral(input: SandboxTransformInput): Promise<SandboxTransformResult> {
        const startTime = Date.now();

        if (!input.templateBuffer || input.templateBuffer.length === 0) {
            throw new SandboxServiceError("Target template PDF is required.", 400);
        }

        if (!input.rawDocumentBuffer || input.rawDocumentBuffer.length === 0) {
            throw new SandboxServiceError("Raw document file is required.", 400);
        }

        // 1. Extract layout AST elements from Template PDF
        let rawExtracted;
        try {
            rawExtracted = await extractPdfElements({ fileBuffer: input.templateBuffer });
        } catch (err: any) {
            console.error("[SandboxService] Template PDF parsing error:", err);
            throw new SandboxServiceError(
                "Unable to extract layout elements from the provided template PDF. Ensure it is a valid text-based PDF.",
                400
            );
        }

        if (!rawExtracted) {
            throw new SandboxServiceError(
                "Unable to extract layout elements from the provided template PDF.",
                400
            );
        }

        // 2. Identify placeholders & schema definition from template AST
        const { schema, extractedElements } = await aiService.processExtractedElements(rawExtracted);

        if (!schema || !schema.fields || schema.fields.length === 0) {
            throw new SandboxServiceError(
                "Could not detect any dynamic field placeholders in your template PDF. Ensure your template contains text labels or fields.",
                400
            );
        }

        // 3. Extract text from raw Document (PDF, Image, or plain text)
        let rawText = "";
        try {
            rawText = await documentService.extractTextFromDocument(
                input.rawDocumentBuffer,
                input.rawDocumentMimeType
            );
        } catch (err: any) {
            console.error("[SandboxService] Raw document extraction error:", err);
            throw new SandboxServiceError(
                "Failed to extract readable content from your document. Verify the file is not password-protected or corrupted.",
                400
            );
        }

        if (!rawText || rawText.trim().length === 0) {
            throw new SandboxServiceError(
                "Document contains no readable text or visual contents for AI extraction.",
                400
            );
        }

        // 4. Gemini AI structured mapping against template schema
        let finalData: Record<string, any> = {};
        try {
            const llmResult = await documentService.processPdfWithSchema(rawText, schema.fields);
            finalData = llmResult?.data || {};
        } catch (err: any) {
            console.error("[SandboxService] Gemini AI schema processing error:", err);
            throw new SandboxServiceError(
                "AI document extraction pipeline failed to map fields to template schema.",
                500
            );
        }

        // 5. Generate Transformed PDF Buffer from template AST and extracted data
        let pdfBuffer: Buffer;
        try {
            pdfBuffer = await generatePdfFromTemplate(extractedElements, finalData, {
                templatePdfBuffer: input.templateBuffer,
            });
        } catch (err: any) {
            console.error("[SandboxService] PDF compilation error:", err);
            throw new SandboxServiceError(
                "Failed to render transformed output PDF from template layout.",
                500
            );
        }

        const processingTimeMs = Date.now() - startTime;
        const cleanDocName = input.rawDocumentName
            ? path.parse(input.rawDocumentName).name
            : "document";

        return {
            filename: `StructurFlow_Transformed_${cleanDocName}.pdf`,
            pdfBase64: pdfBuffer.toString("base64"),
            extractedFields: finalData,
            processingTimeMs,
            meta: {
                documentName: input.rawDocumentName || "raw_document",
                templateName: input.templateName || "Custom Template",
                fieldCount: Object.keys(finalData).length,
                isPreset: false,
            },
        };
    }
}

export const sandboxService = new SandboxService();
