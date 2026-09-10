import path from "path";
import * as fs from "fs";
import { ApiErrors } from "@/utils/errors";
import pdfService from "./pdf.service";
import aiService from "./ai.service";
import extractPdfElements from "@/utils/extractPdfElements";
import generatePdfFromTemplate from "@/utils/generatePdfFromTemplate";
import { logger } from "@/utils/logger";

export interface SandboxTransformInput {
    rawDocumentBuffer: Buffer;
    rawDocumentMimeType: string;
    rawDocumentName: string;
    templateBuffer?: Buffer;
    templateMimeType?: string;
    presetId?: string;
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
        isPreset: boolean;
    };
}

export interface PresetTemplateItem {
    id: string;
    name: string;
    category: string;
    description: string;
    fields: string[];
    sampleDocText?: string;
}

class SandboxService {
    // In-memory cache for processed preset templates so AI doesn't have to re-parse the preset template AST every time
    private presetCache: Map<string, { schema: any; extractedElements: any; buffer: Buffer }> = new Map();

    /**
     * List of available pre-built templates for guest playground testing
     */
    getPresets(): PresetTemplateItem[] {
        return [
            {
                id: "offer_letter",
                name: "Standard Employment Offer Letter",
                category: "Human Resources",
                description: "Extracts candidate details, role, compensation, manager, and joining dates into a formal corporate letter.",
                fields: [
                    "candidate_name",
                    "offer_date",
                    "offer_letter_number",
                    "job_title",
                    "department",
                    "reporting_manager",
                    "joining_date",
                    "base_salary",
                    "annual_bonus",
                    "total_ctc"
                ],
                sampleDocText: `CONFIDENTIAL - EMPLOYMENT CANDIDATE RECORD
Candidate Name: Alex Mercer
Contact: alex.mercer@example.com | +1 (555) 439-0192
Applied Position: Lead Full-Stack Architect
Hiring Unit: Core Cloud Infrastructure Engineering
Direct Supervisor: Sarah Jenkins, VP of Engineering
Anticipated Start Date: October 15, 2026
Compensation Package:
Base Annual Salary: $175,000 USD
Annual Performance Incentive: $25,000 USD
Total Annual Guaranteed CTC: $200,000 USD
Notice Period / Acceptance Cutoff: September 28, 2026
Location: San Francisco, CA (Hybrid Arrangement)`
            },
            {
                id: "consulting_invoice",
                name: "Commercial Services Invoice",
                category: "Finance & Billing",
                description: "Extracts client billing details, line items, service breakdown, tax, and payable balance.",
                fields: [
                    "invoice_number",
                    "invoice_date",
                    "due_date",
                    "vendor_name",
                    "client_name",
                    "client_address",
                    "subtotal",
                    "tax_amount",
                    "total_amount"
                ],
                sampleDocText: `INVOICE / BILLING STATEMENT
Invoice #: INV-2026-8841
Date of Issuance: September 05, 2026
Payment Due: October 05, 2026
Billed To: Apex Digital Innovations LLC, 450 Market Street, Suite 800, Austin, TX
Service Description: Q3 Enterprise API Modernization and Workflow Automation Consulting
Labor / Engineering Hours: 120 Hours @ $150/hr = $18,000.00
Platform Integration & Deployment Surcharge: $2,500.00
Subtotal: $20,500.00
Sales Tax (8.25%): $1,691.25
Total Balance Due: $22,191.25
Payment Method: Wire Transfer / ACH`
            }
        ];
    }

    /**
     * Resolves the template buffer, layout AST elements, and schema for either a custom file or a preset
     */
    private async resolveTemplate(input: SandboxTransformInput): Promise<{
        templatePdfBuffer: Buffer;
        templateName: string;
        schema: any;
        extractedElements: any;
        isPreset: boolean;
    }> {
        // Option A: User uploaded custom template PDF
        if (input.templateBuffer && input.templateBuffer.length > 0) {
            logger.info("Sandbox: Parsing custom guest template PDF");
            const rawExtracted = await extractPdfElements({ fileBuffer: input.templateBuffer });
            if (!rawExtracted) {
                throw ApiErrors.badRequest("Unable to extract layout elements from the provided template PDF. Please ensure it is a valid text-based PDF.");
            }

            const { schema, extractedElements } = await aiService.processExtractedElements(rawExtracted);
            if (!schema || !schema.fields || schema.fields.length === 0) {
                throw ApiErrors.badRequest("Could not detect any replaceable field placeholders or variables in your template PDF. Ensure your template contains text labels or fields.");
            }

            return {
                templatePdfBuffer: input.templateBuffer,
                templateName: "Custom Uploaded Template",
                schema,
                extractedElements,
                isPreset: false
            };
        }

        // Option B: User chose a preset (or fallback to default offer letter preset)
        const presetId = input.presetId || "offer_letter";
        logger.info(`Sandbox: Resolving preset template '${presetId}'`);

        // Check in-memory preset cache first
        if (this.presetCache.has(presetId)) {
            const cached = this.presetCache.get(presetId)!;
            return {
                templatePdfBuffer: cached.buffer,
                templateName: presetId === "offer_letter" ? "Standard Employment Offer Letter" : "Commercial Services Invoice",
                schema: cached.schema,
                extractedElements: cached.extractedElements,
                isPreset: true
            };
        }

        // Locate bundled PDF on disk
        let templatePath = path.resolve(process.cwd(), "Generated_Offer_Letter.pdf");
        if (!fs.existsSync(templatePath)) {
            // Check fallback locations
            templatePath = path.resolve(process.cwd(), "backend/Generated_Offer_Letter.pdf");
        }

        if (!fs.existsSync(templatePath)) {
            throw ApiErrors.badRequest("Preset template PDF is currently unavailable on this server. Please upload your own template PDF.");
        }

        const templateBuffer = fs.readFileSync(templatePath);
        const rawExtracted = await extractPdfElements({ fileBuffer: templateBuffer });
        if (!rawExtracted) {
            throw ApiErrors.failedDocumentExtraction("Failed to parse bundled preset template.");
        }

        const { schema, extractedElements } = await aiService.processExtractedElements(rawExtracted);

        // Cache for rapid sub-second subsequent playground runs
        this.presetCache.set(presetId, {
            schema,
            extractedElements,
            buffer: templateBuffer
        });

        return {
            templatePdfBuffer: templateBuffer,
            templateName: presetId === "offer_letter" ? "Standard Employment Offer Letter" : "Commercial Services Invoice",
            schema,
            extractedElements,
            isPreset: true
        };
    }

    /**
     * Pure in-memory transformation pipeline:
     * 1. Extracts raw document text via OCR/PDF.js
     * 2. Resolves template schema & AST
     * 3. Maps raw data into schema via Gemini AI
     * 4. Compiles transformed PDF buffer
     * 5. Returns base64 output with ZERO database or cloud storage writes
     */
    async transformEphemeral(input: SandboxTransformInput): Promise<SandboxTransformResult> {
        const startTime = Date.now();

        if (!input.rawDocumentBuffer || input.rawDocumentBuffer.length === 0) {
            throw ApiErrors.badRequest("Raw document file is required.");
        }

        // 1. Extract raw text from Document
        logger.info(`Sandbox: Extracting text from raw document (${input.rawDocumentName}, ${input.rawDocumentMimeType})`);
        let rawText = "";
        try {
            rawText = await pdfService.extractTextFromDocument(input.rawDocumentBuffer, input.rawDocumentMimeType);
        } catch (err: any) {
            logger.error(`Sandbox document text extraction failed: ${err.message}`);
            throw ApiErrors.badRequest("Failed to extract readable content from your document. Please verify the file is not password-protected or corrupted.");
        }

        if (!rawText || rawText.trim().length === 0) {
            throw ApiErrors.badRequest("Document contains no readable text or visual contents for AI extraction.");
        }

        // 2. Resolve Template (Custom or Preset)
        const { templatePdfBuffer, templateName, schema, extractedElements, isPreset } = await this.resolveTemplate(input);

        // 3. Gemini AI structured mapping
        logger.info("Sandbox: Calling Gemini AI to map raw document text to template fields");
        const llmResult = await pdfService.processPdfWithSchema(rawText, schema.fields);
        const finalData = llmResult?.data || {};

        // 4. Generate Transformed PDF Buffer
        logger.info("Sandbox: Compiling transformed PDF buffer from template AST");
        const pdfBuffer = await generatePdfFromTemplate(extractedElements, finalData, {
            templatePdfBuffer: templatePdfBuffer
        });

        const processingTimeMs = Date.now() - startTime;
        logger.info(`Sandbox: Completed transformation in ${processingTimeMs}ms with 0 database records stored`);

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
                templateName,
                fieldCount: Object.keys(finalData).length,
                isPreset
            }
        };
    }
}

export const sandboxService = new SandboxService();
export default sandboxService;
