import crypto from "crypto";
import path from "path";
import fs from "fs";
import { pathToFileURL } from "url";
import { createRequire } from "module";
import { and, asc, count, desc, eq, ilike, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { document, project, template } from "@/schema";
import { writeAuditLog } from "@/lib/audit-log";
import { supabase, DOCUMENTS_BUCKET, BUCKET_NAME, ensureDocumentsBucket } from "@/lib/supabase";
import getPdfBufferFromUrl from "@/lib/getBuffer";
import { generatePdfFromTemplate } from "@/utils/generatePdfFromTemplate";
import extractPdfElements from "@/utils/extractPdfElements";
import aiService from "@/lib/services/ai.service";
import { GoogleGenAI } from "@google/genai";
import type { DocumentQueryInput } from "@/lib/validations/document";

// @ts-ignore
import * as pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Ensure in-memory worker reference so pdfjs never tries dynamic bundle lookup in Turbopack
if (typeof globalThis !== "undefined") {
    (globalThis as any).pdfjsWorker = pdfjsWorker;
}

function ensurePdfJsWorker() {
    if (typeof globalThis !== "undefined" && !(globalThis as any).pdfjsWorker) {
        (globalThis as any).pdfjsWorker = pdfjsWorker;
    }
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc || pdfjsLib.GlobalWorkerOptions.workerSrc === "./pdf.worker.mjs") {
        try {
            const req = createRequire(import.meta.url);
            const workerPath = req.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
            pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
        } catch {
            const fallbackPath = path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs");
            if (fs.existsSync(fallbackPath)) {
                pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(fallbackPath).href;
            }
        }
    }
}

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export class DocumentServiceError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 400
    ) {
        super(message);
        this.name = "DocumentServiceError";
        Object.setPrototypeOf(this, DocumentServiceError.prototype);
    }
}

export function formatDocument(
    d: any,
    projectMap?: Map<string, { id: string; name: string }>,
    signedUrl?: string
) {
    const proj = projectMap?.get(d.projectId);
    const processingDetails = d.processingDetails || {};
    const extractedData = d.extractedData || processingDetails.extractedData || processingDetails.extractedText || "";

    return {
        _id: d.id,
        id: d.id,
        organizationId: d.organizationId,
        projectId: proj ? { _id: proj.id, name: proj.name } : d.projectId,
        uploadedById: d.uploadedById,
        originalFilename: d.originalFilename,
        originalFileName: d.originalFilename,
        mimeType: d.mimeType,
        sizeBytes: d.sizeBytes,
        fileHash: d.fileHash,
        publicId: d.publicId,
        secureUrl: signedUrl || d.secureUrl,
        transformedPdfUrl: d.transformedPdfUrl || null,
        status: d.status,
        extractedData,
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: d.updatedAt ? new Date(d.updatedAt).toISOString() : new Date().toISOString(),
        processingDetails,
        auditTrail: d.auditTrail || [],
        rejectionReason: d.rejectionReason || null,
    };
}

export class DocumentService {
    /**
     * Extracts plain text from a PDF buffer using pdfjs-dist
     */
    async extractTextFromPdf(buffer: Buffer): Promise<string> {
        ensurePdfJsWorker();
        try {
            const pdf = await pdfjsLib.getDocument({
                data: new Uint8Array(buffer),
                useSystemFonts: true,
            }).promise;

            const textChunks: string[] = [];
            for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
                const page = await pdf.getPage(pageNumber);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .filter((item: any) => "str" in item)
                    .map((item: any) => item.str)
                    .join(" ");
                if (pageText.trim()) {
                    textChunks.push(pageText.trim());
                }
            }

            return textChunks.join("\n\n");
        } catch (error: any) {
            console.warn("[DocumentService] PDF text extraction warning:", error.message);
            return "";
        }
    }

    /**
     * Extracts text from an image document (JPEG, PNG, WEBP) using Gemini multimodal vision
     */
    async extractTextFromImage(buffer: Buffer, mimeType: string = "image/jpeg"): Promise<string> {
        try {
            const response = await gemini.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                inlineData: {
                                    mimeType,
                                    data: buffer.toString("base64"),
                                },
                            },
                            {
                                text: "Extract and transcribe all text from this document image cleanly and accurately, preserving line breaks and structural layout where possible. Return ONLY the extracted text content.",
                            },
                        ],
                    },
                ],
            });

            return response.text?.trim() || "";
        } catch (error: any) {
            console.warn("[DocumentService] Gemini image text extraction warning:", error.message);
            return "";
        }
    }

    /**
     * Extracts text from either a PDF, Image, or plain text document depending on MIME type
     */
    async extractTextFromDocument(buffer: Buffer, mimeType: string): Promise<string> {
        if (mimeType === "application/pdf") {
            return await this.extractTextFromPdf(buffer);
        } else if (mimeType.startsWith("image/")) {
            return await this.extractTextFromImage(buffer, mimeType);
        } else if (mimeType.startsWith("text/") || mimeType.includes("text")) {
            return buffer.toString("utf-8");
        }
        return "";
    }

    /**
     * Extracts structured fields from document text against active template schema using Gemini
     */
    async processPdfWithSchema(extractedData: string | Record<string, any>[], schema: object) {
        try {
            const dataString = typeof extractedData === 'string' ? extractedData : JSON.stringify(extractedData);
            const schemaString = JSON.stringify(schema, null, 2);

            const prompt = `You are an expert data extraction AI. Your task is to extract information from the provided document text according to the exact JSON schema provided.

DOCUMENT TEXT:
${dataString}

EXPECTED SCHEMA:
${schemaString}

Instructions:
1. Extract the required fields from the document text.
2. Return ONLY a raw, valid JSON object matching the schema.
3. Do NOT include markdown blocks like \`\`\`json.
4. If a field cannot be found, use null or an empty string as appropriate.
`;

            const response = await gemini.models.generateContent({
                model: "gemini-3.5-flash",
                contents: prompt,
                config: {
                    temperature: 0.1,
                    responseMimeType: "application/json"
                }
            });

            const responseText = response.text?.trim() || "{}";

            let cleanJson = responseText;
            if (cleanJson.startsWith('\`\`\`json')) {
                cleanJson = cleanJson.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
            } else if (cleanJson.startsWith('\`\`\`')) {
                cleanJson = cleanJson.replace(/^\`\`\`/, '').replace(/\`\`\`$/, '').trim();
            }

            const parsedData = JSON.parse(cleanJson);

            return {
                data: parsedData,
                parsingIssues: []
            };
        } catch (error: any) {
            throw new Error(`Failed to process PDF with schema: ${error.message}`);
        }
    }

    /**
     * Find document by ID and verify organization ownership
     */
    async findDocumentByIdAndOrg(documentId: string, organizationId: string) {
        const rows = await db
            .select()
            .from(document)
            .where(and(
                eq(document.id, documentId),
                eq(document.organizationId, organizationId),
                eq(document.isDeleted, false)
            ))
            .limit(1);

        return rows[0] || null;
    }

    /**
     * Resolves the active template for a project
     */
    async getActiveTemplateForProject(projectId: string, organizationId: string) {
        const projectRows = await db
            .select()
            .from(project)
            .where(and(
                eq(project.id, projectId),
                eq(project.organizationId, organizationId),
                eq(project.isDeleted, false)
            ))
            .limit(1);

        if (projectRows.length === 0) return null;

        // 1. If project explicitly references an active templateDocumentId
        if (projectRows[0].templateDocumentId) {
            const tRows = await db
                .select()
                .from(template)
                .where(and(
                    eq(template.id, projectRows[0].templateDocumentId),
                    eq(template.isDeleted, false)
                ))
                .limit(1);
            if (tRows.length > 0) return tRows[0];
        }

        // 2. Query template with isActive = true for this project
        const activeRows = await db
            .select()
            .from(template)
            .where(and(
                eq(template.projectId, projectId),
                eq(template.organizationId, organizationId),
                eq(template.isActive, true),
                eq(template.isDeleted, false)
            ))
            .limit(1);
        if (activeRows.length > 0) return activeRows[0];

        // 3. Fallback to latest uploaded template for this project
        const latestRows = await db
            .select()
            .from(template)
            .where(and(
                eq(template.projectId, projectId),
                eq(template.organizationId, organizationId),
                eq(template.isDeleted, false)
            ))
            .orderBy(desc(template.createdAt))
            .limit(1);

        return latestRows[0] || null;
    }

    /**
     * Multi-file document upload
     */
    async uploadDocuments(params: {
        files: File[];
        organizationId: string;
        projectId: string;
        userId: string;
        ipAddress?: string | null;
        userAgent?: string | null;
    }) {
        const { files, organizationId, projectId, userId, ipAddress, userAgent } = params;

        // 1. Verify project exists and belongs to organization
        const projectRows = await db
            .select()
            .from(project)
            .where(and(
                eq(project.id, projectId),
                eq(project.organizationId, organizationId),
                eq(project.isDeleted, false)
            ))
            .limit(1);

        if (projectRows.length === 0) {
            throw new DocumentServiceError("Project not found or does not belong to your organization.", "PROJECT_NOT_FOUND", 404);
        }

        await ensureDocumentsBucket();

        const results = [];

        for (const file of files) {
            const arrayBuffer = await file.arrayBuffer();
            const fileBuffer = Buffer.from(arrayBuffer);

            // Calculate SHA-256 hash for duplicate check
            const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

            // Check for exact duplicates in the same organization
            const dupCountResult = await db
                .select({ value: count() })
                .from(document)
                .where(and(
                    eq(document.organizationId, organizationId),
                    eq(document.fileHash, fileHash),
                    eq(document.isDeleted, false)
                ));

            const isDuplicate = (dupCountResult[0]?.value || 0) > 0;

            // Upload directly to Supabase Storage
            const extension = path.extname(file.name) || ".bin";
            const uniqueId = crypto.randomUUID().replace(/-/g, "");
            const storagePath = `${organizationId}/${projectId}/${uniqueId}${extension}`;

            const { error: uploadError } = await supabase.storage
                .from(DOCUMENTS_BUCKET)
                .upload(storagePath, fileBuffer, {
                    contentType: file.type || "application/octet-stream",
                    upsert: false,
                });

            if (uploadError) {
                throw new DocumentServiceError(`Storage upload failed for ${file.name}: ${uploadError.message}`, "STORAGE_UPLOAD_FAILED", 500);
            }

            // Create signed URL for initial viewing
            let signedUrl = "";
            const { data: signedData } = await supabase.storage
                .from(DOCUMENTS_BUCKET)
                .createSignedUrl(storagePath, 3600);
            if (signedData?.signedUrl) {
                signedUrl = signedData.signedUrl;
            }

            // Extract raw text from document
            let rawText = "";
            try {
                rawText = await this.extractTextFromDocument(fileBuffer, file.type || "");
            } catch (extractErr: any) {
                console.warn(`[DocumentService] Text extraction warning for ${file.name}:`, extractErr.message);
                rawText = "";
            }

            // Insert document record
            const docId = `doc_${crypto.randomUUID().replace(/-/g, "")}`;
            const now = new Date();

            const auditEntry = {
                action: "DOCUMENT_UPLOADED",
                timestamp: now.toISOString(),
                userId,
                details: {
                    filename: file.name,
                    size: file.size,
                    mimeType: file.type,
                    status: "UPLOADED",
                    isDuplicateWarning: isDuplicate,
                },
            };

            const inserted = await db
                .insert(document)
                .values({
                    id: docId,
                    organizationId,
                    projectId,
                    uploadedById: userId,
                    originalFilename: file.name,
                    mimeType: file.type || "application/octet-stream",
                    sizeBytes: file.size,
                    fileHash,
                    publicId: storagePath,
                    secureUrl: signedUrl,
                    status: "UPLOADED",
                    processingDetails: {
                        extractedText: rawText,
                        extractedData: rawText,
                    },
                    auditTrail: [auditEntry],
                    isDeleted: false,
                    createdAt: now,
                    updatedAt: now,
                })
                .returning();

            // Record audit log
            try {
                await writeAuditLog({
                    organizationId,
                    actorId: userId,
                    projectId,
                    documentId: docId,
                    action: "DOCUMENT_UPLOADED",
                    details: {
                        filename: file.name,
                        size: file.size,
                        mimeType: file.type,
                        status: "UPLOADED",
                        isDuplicateWarning: isDuplicate,
                    },
                    ipAddress,
                    userAgent,
                });
            } catch (auditErr) {
                console.warn("[DocumentService] Failed to record DOCUMENT_UPLOADED audit log:", auditErr);
            }

            results.push({
                document: formatDocument(inserted[0], undefined, signedUrl),
                warnings: isDuplicate ? ["An identical file has been uploaded previously."] : [],
            });
        }

        // Update project updatedAt
        await db
            .update(project)
            .set({ updatedAt: new Date() })
            .where(eq(project.id, projectId));

        return results;
    }

    /**
     * Process document using active template schema
     */
    async processDocument(params: {
        documentId: string;
        organizationId: string;
        userId: string;
        ipAddress?: string | null;
        userAgent?: string | null;
    }) {
        const { documentId, organizationId, userId, ipAddress, userAgent } = params;

        const doc = await this.findDocumentByIdAndOrg(documentId, organizationId);
        if (!doc) {
            throw new DocumentServiceError("Document not found", "DOCUMENT_NOT_FOUND", 404);
        }

        // Get project's active template
        const activeTemplate = await this.getActiveTemplateForProject(doc.projectId, organizationId);
        if (!activeTemplate) {
            throw new DocumentServiceError("Active template not found for this project", "TEMPLATE_NOT_FOUND", 404);
        }

        // Ensure active template schema is available
        let templateSchema = activeTemplate.templateSchema;
        if (!templateSchema) {
            try {
                const { data: tmplFileData, error: tmplDlErr } = await supabase.storage
                    .from(BUCKET_NAME)
                    .download(activeTemplate.publicId);

                if (!tmplDlErr && tmplFileData) {
                    const tmplBuffer = Buffer.from(await tmplFileData.arrayBuffer());
                    const rawExtractedElements = await extractPdfElements({ fileBuffer: tmplBuffer });
                    if (rawExtractedElements) {
                        const { schema, extractedElements } = await aiService.processExtractedElements(rawExtractedElements);
                        templateSchema = schema;

                        await db
                            .update(template)
                            .set({
                                templateSchema: schema,
                                extractedElements: extractedElements,
                                pageCount: extractedElements.pageCount ?? activeTemplate.pageCount ?? 1,
                                status: "READY",
                                updatedAt: new Date(),
                            })
                            .where(eq(template.id, activeTemplate.id));
                    }
                }
            } catch (tmplErr) {
                console.warn("[DocumentService] Template schema extraction warning:", tmplErr);
            }
        }

        if (!templateSchema) {
            throw new DocumentServiceError("Active template schema is missing or invalid", "INVALID_TEMPLATE_SCHEMA", 400);
        }

        // Retrieve document extracted text
        let extractedText = (doc.processingDetails as any)?.extractedText || "";

        if (!extractedText) {
            try {
                const { data: docFileData, error: docDlErr } = await supabase.storage
                    .from(DOCUMENTS_BUCKET)
                    .download(doc.publicId);

                if (!docDlErr && docFileData) {
                    const docBuffer = Buffer.from(await docFileData.arrayBuffer());
                    extractedText = await this.extractTextFromDocument(docBuffer, doc.mimeType);
                }
            } catch (docErr) {
                console.warn("[DocumentService] Document re-download for text extraction failed:", docErr);
            }
        }

        if (!extractedText) {
            throw new DocumentServiceError("Document contains no extracted text to transform", "NO_EXTRACTED_TEXT", 400);
        }

        // Run Gemini extraction against schema
        const schemaFields = (templateSchema as any)?.fields || templateSchema;
        const llmResult = await this.processPdfWithSchema(extractedText, schemaFields);

        const now = new Date();
        const existingAudit = doc.auditTrail || [];
        existingAudit.push({
            action: "DOCUMENT_TRANSFORMED",
            timestamp: now.toISOString(),
            userId,
            details: {
                filename: doc.originalFilename,
                templateId: activeTemplate.id,
                fieldsExtracted: Object.keys(llmResult?.data || {}).length,
                status: "TRANSFORMED",
            },
        });

        const updatedProcessingDetails = {
            ...((doc.processingDetails as any) || {}),
            extractedText,
            extractedData: extractedText,
            aiResponse: llmResult,
            rawJson: llmResult?.data,
            extractedAt: now.toISOString(),
            templateId: activeTemplate.id,
        };

        await db
            .update(document)
            .set({
                status: "TRANSFORMED",
                processingDetails: updatedProcessingDetails,
                auditTrail: existingAudit,
                updatedAt: now,
            })
            .where(eq(document.id, documentId));

        // Record audit log
        try {
            await writeAuditLog({
                organizationId,
                actorId: userId,
                projectId: doc.projectId,
                documentId,
                action: "DOCUMENT_TRANSFORMED",
                details: {
                    filename: doc.originalFilename,
                    templateId: activeTemplate.id,
                    fieldsExtracted: Object.keys(llmResult?.data || {}).length,
                    status: "TRANSFORMED",
                },
                ipAddress,
                userAgent,
            });
        } catch (auditErr) {
            console.warn("[DocumentService] Failed to record DOCUMENT_TRANSFORMED audit log:", auditErr);
        }

        return llmResult;
    }

    /**
     * Downloads the template PDF buffer reliably:
     * 1. Direct storage download from Supabase Storage (publicId)
     * 2. Fallback to activeTemplate.secureUrl if it is a valid HTTP URL
     * 3. Fallback to signed URL generation from publicId
     */
    async getTemplatePdfBuffer(activeTemplate: { publicId: string; secureUrl?: string | null }): Promise<Buffer> {
        if (activeTemplate.publicId) {
            try {
                const { data, error } = await supabase.storage
                    .from(BUCKET_NAME)
                    .download(activeTemplate.publicId);

                if (!error && data) {
                    return Buffer.from(await data.arrayBuffer());
                }
            } catch (err: any) {
                console.warn("[DocumentService] Direct storage download failed for template:", err?.message);
            }
        }

        if (activeTemplate.secureUrl && activeTemplate.secureUrl.trim().startsWith("http")) {
            try {
                return await getPdfBufferFromUrl(activeTemplate.secureUrl.trim());
            } catch (err: any) {
                console.warn("[DocumentService] Fetch from secureUrl failed:", err?.message);
            }
        }

        if (activeTemplate.publicId) {
            try {
                const { data: signed, error: signErr } = await supabase.storage
                    .from(BUCKET_NAME)
                    .createSignedUrl(activeTemplate.publicId, 3600);

                if (!signErr && signed?.signedUrl) {
                    return await getPdfBufferFromUrl(signed.signedUrl);
                }
            } catch (err: any) {
                console.warn("[DocumentService] Fetch from signed URL failed:", err?.message);
            }
        }

        throw new DocumentServiceError("Failed to retrieve template PDF buffer.", "TEMPLATE_BUFFER_FAILED", 500);
    }

    /**
     * Generates a transformed document preview base64 PDF
     */
    async getTransformedDocumentPreview(documentId: string, organizationId: string) {
        const doc = await this.findDocumentByIdAndOrg(documentId, organizationId);
        if (!doc) {
            throw new DocumentServiceError("Document not found", "DOCUMENT_NOT_FOUND", 404);
        }

        const processingDetails = (doc.processingDetails as any) || {};

        if (
            (doc.status === "VERIFIED" || doc.status === "EXPORTED") &&
            (doc.transformedPdfUrl || processingDetails?.secureUrl)
        ) {
            return {
                url: doc.transformedPdfUrl || processingDetails?.secureUrl,
                status: doc.status,
            };
        }

        const aiData = processingDetails?.aiResponse?.data;
        if (!aiData) {
            throw new DocumentServiceError("Document has not been processed yet.", "DOCUMENT_NOT_PROCESSED", 400);
        }

        // Get active template
        const activeTemplate = await this.getActiveTemplateForProject(doc.projectId, organizationId);
        if (!activeTemplate) {
            throw new DocumentServiceError("Active template not found for this project", "TEMPLATE_NOT_FOUND", 404);
        }

        // Fetch template PDF buffer reliably
        const templatePdfBuffer = await this.getTemplatePdfBuffer(activeTemplate);

        // Ensure template extractedElements
        let extractedElements = activeTemplate.extractedElements;
        if (!extractedElements && templatePdfBuffer) {
            try {
                extractedElements = await extractPdfElements({ fileBuffer: templatePdfBuffer });
            } catch (extErr) {
                console.warn("[DocumentService] extractPdfElements fallback in preview:", extErr);
            }
        }

        if (!extractedElements || !templatePdfBuffer) {
            throw new DocumentServiceError("Template extraction elements not found", "TEMPLATE_EXTRACTION_FAILED", 500);
        }

        const elementsList = Array.isArray(extractedElements)
            ? extractedElements
            : (extractedElements as any)?.elements || (extractedElements as any)?.texts || [];

        // Generate transformed PDF buffer
        const pdfBuffer = await generatePdfFromTemplate(
            elementsList,
            aiData,
            { templatePdfBuffer }
        );

        // Convert Buffer to base64 Data URL
        const previewPdf = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;

        return { url: previewPdf, status: doc.status };
    }

    /**
     * Verifies document, merges corrections, generates final transformed PDF, and stores to Supabase
     */
    async verifyDocument(params: {
        documentId: string;
        organizationId: string;
        userId?: string;
        ipAddress?: string | null;
        userAgent?: string | null;
        correctedData?: Record<string, any>;
    }) {
        const { documentId, organizationId, userId, ipAddress, userAgent, correctedData } = params;

        const doc = await this.findDocumentByIdAndOrg(documentId, organizationId);
        if (!doc) {
            throw new DocumentServiceError("Document not found", "DOCUMENT_NOT_FOUND", 404);
        }

        const processingDetails = (doc.processingDetails as any) || {};
        const hasCorrections = Boolean(
            correctedData && typeof correctedData === "object" && Object.keys(correctedData).length > 0
        );

        // If already verified or exported, no corrections provided, and secureUrl exists, return it directly (refreshing signed URL if publicId available)
        if (
            !hasCorrections &&
            (doc.status === "VERIFIED" || doc.status === "EXPORTED") &&
            (doc.transformedPdfUrl || processingDetails?.secureUrl)
        ) {
            if (processingDetails?.publicId) {
                try {
                    const { data: signed } = await supabase.storage
                        .from(DOCUMENTS_BUCKET)
                        .createSignedUrl(processingDetails.publicId, 3600 * 24 * 7);
                    if (signed?.signedUrl) {
                        return signed.signedUrl;
                    }
                } catch { }
            }
            return doc.transformedPdfUrl || processingDetails.secureUrl;
        }

        const currentData = processingDetails?.aiResponse?.data;
        if (!currentData && !hasCorrections) {
            if (doc.status === "UPLOADED") {
                throw new DocumentServiceError("Document has not been processed yet. Please transform the document first.", "NOT_TRANSFORMED", 400);
            }
            throw new DocumentServiceError(`Document cannot be verified because extracted data is missing (current status: ${doc.status}).`, "MISSING_DATA", 400);
        }

        // Apply corrections to both originalValue and value
        let finalData = currentData;
        if (hasCorrections && correctedData) {
            if (Array.isArray(currentData)) {
                const matchedKeys = new Set<string>();
                finalData = currentData.map((field: any) => {
                    const key = field.fieldName || field.name || field.key;
                    if (key && correctedData[key] !== undefined) {
                        matchedKeys.add(key);
                        return {
                            ...field,
                            originalValue: correctedData[key],
                            value: String(correctedData[key]),
                        };
                    }
                    return field;
                });

                // Append any new fields provided in correctedData that weren't in currentData array
                for (const [key, val] of Object.entries(correctedData)) {
                    if (!matchedKeys.has(key)) {
                        finalData.push({
                            fieldName: key,
                            label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                            type: typeof val === "number" ? "currency" : "string",
                            required: false,
                            placeholder: `{{${key}}}`,
                            originalValue: val,
                            value: String(val),
                        });
                    }
                }
            } else {
                finalData = { ...(currentData || {}), ...correctedData };
            }
        }

        // Get active template
        const activeTemplate = await this.getActiveTemplateForProject(doc.projectId, organizationId);
        if (!activeTemplate) {
            throw new DocumentServiceError("Active template not found for this project", "TEMPLATE_NOT_FOUND", 404);
        }

        // Fetch template PDF buffer reliably
        const templatePdfBuffer = await this.getTemplatePdfBuffer(activeTemplate);

        // Ensure extracted elements
        let extractedElements = activeTemplate.extractedElements;
        if (!extractedElements && templatePdfBuffer) {
            try {
                extractedElements = await extractPdfElements({ fileBuffer: templatePdfBuffer });
            } catch (extErr) {
                console.warn("[DocumentService] extractPdfElements fallback in verify:", extErr);
            }
        }

        const elementsList = Array.isArray(extractedElements)
            ? extractedElements
            : (extractedElements as any)?.elements || (extractedElements as any)?.texts || [];

        // Generate final PDF
        const pdfBuffer = await generatePdfFromTemplate(
            elementsList,
            finalData,
            { templatePdfBuffer }
        );

        // Upload to Supabase Storage
        const filename = `${crypto.randomUUID().replace(/-/g, "")}.pdf`;
        const transformedPublicId = `${organizationId}/transformed/${filename}`;

        await ensureDocumentsBucket();
        const { error: uploadErr } = await supabase.storage
            .from(DOCUMENTS_BUCKET)
            .upload(transformedPublicId, pdfBuffer, {
                contentType: "application/pdf",
                upsert: true,
            });

        if (uploadErr) {
            throw new DocumentServiceError(`Failed to upload transformed PDF: ${uploadErr.message}`, "STORAGE_UPLOAD_FAILED", 500);
        }

        // Create long-lived signed URL (7 days)
        let transformedSecureUrl = "";
        const { data: signedData } = await supabase.storage
            .from(DOCUMENTS_BUCKET)
            .createSignedUrl(transformedPublicId, 3600 * 24 * 7);

        if (signedData?.signedUrl) {
            transformedSecureUrl = signedData.signedUrl;
        }

        // Update document
        const now = new Date();
        const existingAudit = doc.auditTrail || [];
        existingAudit.push({
            action: "DOCUMENT_VERIFIED",
            timestamp: now.toISOString(),
            userId: userId || doc.uploadedById || undefined,
            details: {
                filename: doc.originalFilename,
                status: "VERIFIED",
                url: transformedSecureUrl,
                correctionsApplied: hasCorrections,
                correctedFieldsCount: hasCorrections && correctedData ? Object.keys(correctedData).length : 0,
            },
        });

        await db
            .update(document)
            .set({
                status: "VERIFIED",
                transformedPdfUrl: transformedSecureUrl,
                processingDetails: {
                    ...processingDetails,
                    aiResponse: {
                        ...(processingDetails?.aiResponse || {}),
                        data: finalData,
                    },
                    publicId: transformedPublicId,
                    secureUrl: transformedSecureUrl,
                },
                auditTrail: existingAudit,
                updatedAt: now,
            })
            .where(eq(document.id, documentId));

        // Record audit log
        try {
            await writeAuditLog({
                organizationId,
                actorId: userId || doc.uploadedById || "",
                projectId: doc.projectId,
                documentId,
                action: "DOCUMENT_VERIFIED",
                details: {
                    filename: doc.originalFilename,
                    status: "VERIFIED",
                    url: transformedSecureUrl,
                    correctionsApplied: hasCorrections,
                    correctedFieldsCount: hasCorrections && correctedData ? Object.keys(correctedData).length : 0,
                },
                ipAddress,
                userAgent,
            });
        } catch (auditErr) {
            console.warn("[DocumentService] Failed to record DOCUMENT_VERIFIED audit log:", auditErr);
        }

        return transformedSecureUrl;
    }

    /**
     * Concurrently verifies multiple documents
     */
    async bulkVerifyDocuments(params: {
        documentIds: string[];
        organizationId: string;
        userId?: string;
        ipAddress?: string | null;
        userAgent?: string | null;
    }) {
        const { documentIds, organizationId, userId, ipAddress, userAgent } = params;

        if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
            throw new DocumentServiceError("Please provide an array of document IDs to verify.", "INVALID_INPUT", 400);
        }

        const successful: string[] = [];
        const failed: { id: string; error: string }[] = [];

        await Promise.allSettled(
            documentIds.map(async (id) => {
                try {
                    await this.verifyDocument({
                        documentId: id,
                        organizationId,
                        userId,
                        ipAddress,
                        userAgent,
                    });
                    successful.push(id);
                } catch (err: any) {
                    failed.push({
                        id,
                        error: err?.message || "Verification failed",
                    });
                }
            })
        );

        return { successful, failed, total: documentIds.length };
    }

    /**
     * Rejects a document with an optional reason
     */
    async rejectDocument(params: {
        documentId: string;
        organizationId: string;
        reason?: string;
        userId?: string;
        ipAddress?: string | null;
        userAgent?: string | null;
    }) {
        const { documentId, organizationId, reason, userId, ipAddress, userAgent } = params;

        const doc = await this.findDocumentByIdAndOrg(documentId, organizationId);
        if (!doc) {
            throw new DocumentServiceError("Document not found", "DOCUMENT_NOT_FOUND", 404);
        }

        const now = new Date();
        const existingAudit = doc.auditTrail || [];
        existingAudit.push({
            action: "DOCUMENT_REJECTED",
            timestamp: now.toISOString(),
            userId: userId || doc.uploadedById || undefined,
            details: {
                filename: doc.originalFilename,
                status: "REJECTED",
                reason: reason || "Rejected by reviewer during verification",
            },
        });

        await db
            .update(document)
            .set({
                status: "REJECTED",
                rejectionReason: reason || "Rejected by reviewer during verification",
                auditTrail: existingAudit,
                updatedAt: now,
            })
            .where(eq(document.id, documentId));

        try {
            await writeAuditLog({
                organizationId,
                actorId: userId || doc.uploadedById || "",
                projectId: doc.projectId,
                documentId,
                action: "DOCUMENT_REJECTED",
                details: {
                    filename: doc.originalFilename,
                    status: "REJECTED",
                    reason: reason || "Rejected by reviewer during verification",
                },
                ipAddress,
                userAgent,
            });
        } catch (auditErr) {
            console.warn("[DocumentService] Failed to record DOCUMENT_REJECTED audit log:", auditErr);
        }

        return { success: true, documentId, status: "REJECTED" };
    }

    /**
     * Paginated documents list for a specific project
     */
    async getDocumentsList(projectId: string, organizationId: string, options: DocumentQueryInput) {
        const page = Math.max(1, options.page || 1);
        const limit = Math.max(1, Math.min(100, options.limit || 10));
        const offset = (page - 1) * limit;

        const conditions = [
            eq(document.projectId, projectId),
            eq(document.organizationId, organizationId),
            eq(document.isDeleted, false),
        ];

        if (options.status && options.status !== "ALL") {
            if (options.status === "NEEDS_VERIFICATION" || options.status === "PENDING") {
                conditions.push(inArray(document.status, ["TRANSFORMED", "REVIEW_REQUIRED"]));
            } else {
                conditions.push(eq(document.status, options.status));
            }
        }

        if (options.search && options.search.trim()) {
            conditions.push(ilike(document.originalFilename, `%${options.search.trim()}%`));
        }

        const whereClause = and(...conditions);

        let orderField;
        if (options.sortBy === "name") {
            orderField = options.sortOrder === "asc" ? asc(document.originalFilename) : desc(document.originalFilename);
        } else if (options.sortBy === "size") {
            orderField = options.sortOrder === "asc" ? asc(document.sizeBytes) : desc(document.sizeBytes);
        } else if (options.sortBy === "status") {
            orderField = options.sortOrder === "asc" ? asc(document.status) : desc(document.status);
        } else {
            orderField = options.sortOrder === "asc" ? asc(document.createdAt) : desc(document.createdAt);
        }

        const totalResult = await db
            .select({ value: count() })
            .from(document)
            .where(whereClause);

        const total = totalResult[0]?.value || 0;

        const docRows = await db
            .select()
            .from(document)
            .where(whereClause)
            .orderBy(orderField)
            .limit(limit)
            .offset(offset);

        const formattedDocs = await Promise.all(
            docRows.map(async (d) => {
                let freshUrl = d.secureUrl;
                try {
                    const { data: signed } = await supabase.storage
                        .from(DOCUMENTS_BUCKET)
                        .createSignedUrl(d.publicId, 3600);
                    if (signed?.signedUrl) freshUrl = signed.signedUrl;
                } catch { }
                return formatDocument(d, undefined, freshUrl);
            })
        );

        const totalPages = Math.ceil(total / limit);

        return {
            documents: formattedDocs,
            total,
            page,
            limit,
            totalPages,
        };
    }

    /**
     * Organization-wide paginated documents list with optional project filter and KPI statistics
     */
    async getOrganizationDocuments(organizationId: string, options: DocumentQueryInput) {
        const page = Math.max(1, options.page || 1);
        const limit = Math.max(1, Math.min(100, options.limit || 10));
        const offset = (page - 1) * limit;

        const conditions = [
            eq(document.organizationId, organizationId),
            eq(document.isDeleted, false),
        ];

        if (options.projectId && options.projectId !== "ALL") {
            conditions.push(eq(document.projectId, options.projectId));
        }

        if (options.status && options.status !== "ALL") {
            if (options.status === "NEEDS_VERIFICATION" || options.status === "PENDING") {
                conditions.push(inArray(document.status, ["TRANSFORMED", "REVIEW_REQUIRED"]));
            } else {
                conditions.push(eq(document.status, options.status));
            }
        }

        if (options.search && options.search.trim()) {
            conditions.push(ilike(document.originalFilename, `%${options.search.trim()}%`));
        }

        const whereClause = and(...conditions);

        let orderField;
        if (options.sortBy === "name") {
            orderField = options.sortOrder === "asc" ? asc(document.originalFilename) : desc(document.originalFilename);
        } else if (options.sortBy === "size") {
            orderField = options.sortOrder === "asc" ? asc(document.sizeBytes) : desc(document.sizeBytes);
        } else if (options.sortBy === "status") {
            orderField = options.sortOrder === "asc" ? asc(document.status) : desc(document.status);
        } else {
            orderField = options.sortOrder === "asc" ? asc(document.createdAt) : desc(document.createdAt);
        }

        const totalResult = await db
            .select({ value: count() })
            .from(document)
            .where(whereClause);

        const total = totalResult[0]?.value || 0;

        const docRows = await db
            .select()
            .from(document)
            .where(whereClause)
            .orderBy(orderField)
            .limit(limit)
            .offset(offset);

        // Fetch project names
        const projectIds = Array.from(new Set(docRows.map((d) => d.projectId)));
        const projectRows = projectIds.length > 0
            ? await db
                .select({ id: project.id, name: project.name })
                .from(project)
                .where(inArray(project.id, projectIds))
            : [];
        const projectMap = new Map(projectRows.map((p) => [p.id, p]));

        // Calculate KPI stats across organization
        const allOrgDocs = await db
            .select({ status: document.status })
            .from(document)
            .where(and(eq(document.organizationId, organizationId), eq(document.isDeleted, false)));

        const stats = {
            total: allOrgDocs.length,
            uploaded: 0,
            processing: 0,
            transformed: 0,
            verified: 0,
            needsVerification: 0,
            exported: 0,
            failed: 0,
        };

        for (const row of allOrgDocs) {
            switch (row.status) {
                case "UPLOADED":
                    stats.uploaded++;
                    break;
                case "PROCESSING":
                    stats.processing++;
                    break;
                case "TRANSFORMED":
                    stats.transformed++;
                    stats.needsVerification++;
                    break;
                case "REVIEW_REQUIRED":
                    stats.needsVerification++;
                    break;
                case "VERIFIED":
                    stats.verified++;
                    break;
                case "EXPORTED":
                    stats.exported++;
                    break;
                case "FAILED":
                case "REJECTED":
                    stats.failed++;
                    break;
            }
        }

        const formattedDocs = await Promise.all(
            docRows.map(async (d) => {
                let freshUrl = d.secureUrl;
                try {
                    const { data: signed } = await supabase.storage
                        .from(DOCUMENTS_BUCKET)
                        .createSignedUrl(d.publicId, 3600);
                    if (signed?.signedUrl) freshUrl = signed.signedUrl;
                } catch { }
                return formatDocument(d, projectMap, freshUrl);
            })
        );

        const totalPages = Math.ceil(total / limit);

        return {
            documents: formattedDocs,
            total,
            page,
            limit,
            totalPages,
            stats,
        };
    }

    /**
     * Document summary statistics by project
     */
    async getDocumentSummary(projectId: string, organizationId: string) {
        const docRows = await db
            .select({ status: document.status })
            .from(document)
            .where(and(
                eq(document.projectId, projectId),
                eq(document.organizationId, organizationId),
                eq(document.isDeleted, false)
            ));

        const summary = {
            TOTAL: docRows.length,
            UPLOADED: 0,
            TRANSFORMED: 0,
            VERIFIED: 0,
            REJECTED: 0,
            EXPORTED: 0,
        };

        for (const row of docRows) {
            switch (row.status) {
                case "UPLOADED":
                    summary.UPLOADED++;
                    break;
                case "TRANSFORMED":
                    summary.TRANSFORMED++;
                    break;
                case "VERIFIED":
                    summary.VERIFIED++;
                    break;
                case "REJECTED":
                case "FAILED":
                    summary.REJECTED++;
                    break;
                case "EXPORTED":
                    summary.EXPORTED++;
                    break;
            }
        }

        return summary;
    }

    /**
     * Get document details with audit trail and download URL
     */
    async getDocumentDetails(documentId: string, organizationId: string) {
        const d = await this.findDocumentByIdAndOrg(documentId, organizationId);
        if (!d) {
            throw new DocumentServiceError("Document not found", "DOCUMENT_NOT_FOUND", 404);
        }

        // Generate fresh signed URL (prioritizing transformed PDF if available)
        const processingDetails = (d.processingDetails as any) || {};
        const transformedStoragePath = processingDetails?.publicId;

        let downloadUrl = d.transformedPdfUrl || processingDetails?.secureUrl || d.secureUrl;
        if (transformedStoragePath) {
            try {
                const { data: signed } = await supabase.storage
                    .from(DOCUMENTS_BUCKET)
                    .createSignedUrl(transformedStoragePath, 3600 * 24 * 7);
                if (signed?.signedUrl) downloadUrl = signed.signedUrl;
            } catch { }
        } else {
            try {
                const { data: signed } = await supabase.storage
                    .from(DOCUMENTS_BUCKET)
                    .createSignedUrl(d.publicId, 3600);
                if (signed?.signedUrl) downloadUrl = signed.signedUrl;
            } catch { }
        }

        // Fetch active template HTML if available
        let templateHtml: string | undefined = undefined;
        if (d.projectId) {
            const activeTemplate = await this.getActiveTemplateForProject(d.projectId, organizationId);
            if (activeTemplate?.htmlContent) {
                templateHtml = activeTemplate.htmlContent;
            }
        }

        return {
            document: formatDocument(d, undefined, downloadUrl),
            auditTrail: d.auditTrail || [],
            downloadUrl,
            status: d.status,
        };
    }

    /**
     * Updates document status (e.g. EXPORTED) and generates signed URL
     */
    async updateDocumentStatus(params: {
        documentId: string;
        organizationId: string;
        status?: string;
        userId?: string;
        ipAddress?: string | null;
        userAgent?: string | null;
    }) {
        const { documentId, organizationId, status = "EXPORTED", userId, ipAddress, userAgent } = params;

        const doc = await this.findDocumentByIdAndOrg(documentId, organizationId);
        if (!doc) {
            throw new DocumentServiceError("Document not found", "DOCUMENT_NOT_FOUND", 404);
        }

        const now = new Date();
        const existingAudit = doc.auditTrail || [];
        existingAudit.push({
            action: status === "EXPORTED" ? "DOCUMENT_STATUS_CHANGED" : status === "VERIFIED" ? "DOCUMENT_VERIFIED" : "DOCUMENT_REJECTED",
            timestamp: now.toISOString(),
            userId: userId || doc.uploadedById || undefined,
            details: {
                filename: doc.originalFilename,
                fromStatus: doc.status,
                toStatus: status,
                status,
            },
        });

        await db
            .update(document)
            .set({
                status,
                auditTrail: existingAudit,
                updatedAt: now,
            })
            .where(eq(document.id, documentId));

        // Record audit log
        try {
            await writeAuditLog({
                organizationId,
                actorId: userId || doc.uploadedById || "",
                projectId: doc.projectId,
                documentId,
                action: status === "EXPORTED" ? "DOCUMENT_STATUS_CHANGED" : status === "VERIFIED" ? "DOCUMENT_VERIFIED" : "DOCUMENT_REJECTED",
                details: {
                    filename: doc.originalFilename,
                    fromStatus: doc.status,
                    toStatus: status,
                    status,
                },
                ipAddress,
                userAgent,
            });
        } catch (auditErr) {
            console.warn("[DocumentService] Failed to record audit log:", auditErr);
        }

        // Generate transformed PDF download URL matching Express backend:
        // Express returns: document.processingDetails?.secureUrl || document.secureUrl
        const processingDetails = (doc.processingDetails as any) || {};
        const transformedStoragePath = processingDetails?.publicId;

        let downloadUrl = "";

        // 1. If transformed PDF exists in storage, create a fresh signed URL
        if (transformedStoragePath) {
            try {
                const { data: signed } = await supabase.storage
                    .from(DOCUMENTS_BUCKET)
                    .createSignedUrl(transformedStoragePath, 3600 * 24 * 7);
                if (signed?.signedUrl) {
                    downloadUrl = signed.signedUrl;
                }
            } catch (err: any) {
                console.warn("[DocumentService] Failed to generate signed URL for transformed PDF:", err?.message);
            }
        }

        // 2. Fall back to existing transformed URL if signed URL generation failed
        if (!downloadUrl && (doc.transformedPdfUrl || processingDetails?.secureUrl)) {
            downloadUrl = doc.transformedPdfUrl || processingDetails.secureUrl;
        }

        // 3. If document was transformed (has AI data) but not yet compiled/verified to storage, compile and upload now:
        if (!downloadUrl && processingDetails?.aiResponse?.data) {
            try {
                const activeTemplate = await this.getActiveTemplateForProject(doc.projectId, organizationId);
                if (activeTemplate) {
                    const templatePdfBuffer = await this.getTemplatePdfBuffer(activeTemplate);
                    let extractedElements = activeTemplate.extractedElements;
                    if (!extractedElements && templatePdfBuffer) {
                        try {
                            extractedElements = await extractPdfElements({ fileBuffer: templatePdfBuffer });
                        } catch { }
                    }

                    const elementsList = Array.isArray(extractedElements)
                        ? extractedElements
                        : (extractedElements as any)?.elements || (extractedElements as any)?.texts || [];

                    if (elementsList.length > 0 && templatePdfBuffer) {
                        const pdfBuffer = await generatePdfFromTemplate(
                            elementsList,
                            processingDetails.aiResponse.data,
                            { templatePdfBuffer }
                        );

                        const filename = `${crypto.randomUUID().replace(/-/g, "")}.pdf`;
                        const transformedPublicId = `${organizationId}/transformed/${filename}`;

                        await ensureDocumentsBucket();
                        const { error: upErr } = await supabase.storage
                            .from(DOCUMENTS_BUCKET)
                            .upload(transformedPublicId, pdfBuffer, {
                                contentType: "application/pdf",
                                upsert: true,
                            });

                        if (!upErr) {
                            const { data: signedData } = await supabase.storage
                                .from(DOCUMENTS_BUCKET)
                                .createSignedUrl(transformedPublicId, 3600 * 24 * 7);

                            if (signedData?.signedUrl) {
                                downloadUrl = signedData.signedUrl;

                                await db
                                    .update(document)
                                    .set({
                                        transformedPdfUrl: downloadUrl,
                                        processingDetails: {
                                            ...processingDetails,
                                            publicId: transformedPublicId,
                                            secureUrl: downloadUrl,
                                        },
                                        updatedAt: now,
                                    })
                                    .where(eq(document.id, documentId));
                            }
                        }
                    }
                }
            } catch (genErr: any) {
                console.warn("[DocumentService] On-demand transformed PDF generation in export failed:", genErr?.message);
            }
        }

        // 4. Fallback to raw document only if not a transformed document
        if (!downloadUrl) {
            downloadUrl = doc.secureUrl;
            try {
                const { data: signed } = await supabase.storage
                    .from(DOCUMENTS_BUCKET)
                    .createSignedUrl(doc.publicId, 3600);
                if (signed?.signedUrl) downloadUrl = signed.signedUrl;
            } catch { }
        }

        return downloadUrl;
    }

    /**
     * Updates document's AI generated JSON
     */
    async updateDocumentAIGeneratedJSON(params: {
        documentId: string;
        organizationId: string;
        updates: Record<string, any>;
        userId: string;
        ipAddress?: string | null;
        userAgent?: string | null;
    }) {
        const { documentId, organizationId, updates = {}, userId, ipAddress, userAgent } = params;

        const doc = await this.findDocumentByIdAndOrg(documentId, organizationId);
        if (!doc) {
            throw new DocumentServiceError("Document not found", "DOCUMENT_NOT_FOUND", 404);
        }

        const now = new Date();
        const updatedFields = Object.keys(updates || {});
        const existingAudit = doc.auditTrail || [];
        existingAudit.push({
            action: "UPDATE_AI_GENERATED_JSON",
            timestamp: now.toISOString(),
            userId: userId || doc.uploadedById || undefined,
            details: {
                filename: doc.originalFilename,
                status: doc.status,
                updatedFields,
                fieldsCount: updatedFields.length,
            },
        });

        const currentProcessingDetails = (doc.processingDetails as any) || {};
        const currentAiResponse = currentProcessingDetails.aiResponse || {};
        const currentAiData = currentAiResponse.data;

        // 1. Update aiResponse.data (handles both array of field objects and flat key-value dictionary)
        let updatedAiData: any;
        if (Array.isArray(currentAiData)) {
            const matchedKeys = new Set<string>();
            updatedAiData = currentAiData.map((field: any) => {
                const key =
                    field?.fieldName ||
                    field?.name ||
                    field?.key ||
                    (field?.placeholder ? String(field.placeholder).replace(/^\{\{|\}\}$/g, "").trim() : "");

                if (key && updates[key] !== undefined) {
                    matchedKeys.add(key);
                    return {
                        ...field,
                        originalValue: updates[key],
                        value: String(updates[key]),
                    };
                }
                return field;
            });

            // Append any new fields from updates not present in existing aiData
            for (const [key, val] of Object.entries(updates)) {
                if (!matchedKeys.has(key)) {
                    updatedAiData.push({
                        fieldName: key,
                        label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                        type: typeof val === "number" ? "number" : "string",
                        required: false,
                        placeholder: `{{${key}}}`,
                        originalValue: val,
                        value: String(val),
                    });
                }
            }
        } else if (currentAiData && typeof currentAiData === "object") {
            updatedAiData = {
                ...currentAiData,
                ...updates,
            };
        } else {
            updatedAiData = { ...updates };
        }

        // 2. Update rawJson (handles both flat key-value dictionary and array formats)
        const currentRawJson = currentProcessingDetails.rawJson;
        let updatedRawJson: any;
        if (Array.isArray(currentRawJson)) {
            const matchedRawKeys = new Set<string>();
            updatedRawJson = currentRawJson.map((field: any) => {
                const key =
                    field?.fieldName ||
                    field?.name ||
                    field?.key ||
                    (field?.placeholder ? String(field.placeholder).replace(/^\{\{|\}\}$/g, "").trim() : "");

                if (key && updates[key] !== undefined) {
                    matchedRawKeys.add(key);
                    return {
                        ...field,
                        originalValue: updates[key],
                        value: String(updates[key]),
                    };
                }
                return field;
            });

            for (const [key, val] of Object.entries(updates)) {
                if (!matchedRawKeys.has(key)) {
                    updatedRawJson.push({
                        fieldName: key,
                        originalValue: val,
                        value: String(val),
                    });
                }
            }
        } else if (currentRawJson && typeof currentRawJson === "object") {
            updatedRawJson = {
                ...currentRawJson,
                ...updates,
            };
        } else {
            updatedRawJson = { ...updates };
        }

        const updatedProcessingDetails = {
            ...currentProcessingDetails,
            aiResponse: {
                ...currentAiResponse,
                data: updatedAiData,
            },
            rawJson: updatedRawJson,
        };

        await db
            .update(document)
            .set({
                processingDetails: updatedProcessingDetails,
                auditTrail: existingAudit,
                updatedAt: now,
            })
            .where(eq(document.id, documentId));

        // Record audit log
        try {
            await writeAuditLog({
                organizationId,
                actorId: userId || doc.uploadedById || "",
                projectId: doc.projectId,
                documentId,
                action: "DOCUMENT_UPDATED",
                details: {
                    filename: doc.originalFilename,
                    status: doc.status,
                    updatedFields,
                    fieldsCount: updatedFields.length,
                },
                ipAddress,
                userAgent,
            });
        } catch (auditErr) {
            console.warn("[DocumentService] Failed to record audit log:", auditErr);
        }

        return true;
    }

    /**
     * Soft-deletes a document
     */
    async deleteDocument(params: {
        documentId: string;
        organizationId: string;
        userId: string;
        ipAddress?: string | null;
        userAgent?: string | null;
    }) {
        const { documentId, organizationId, userId, ipAddress, userAgent } = params;

        const doc = await this.findDocumentByIdAndOrg(documentId, organizationId);
        if (!doc) {
            throw new DocumentServiceError("Document not found", "DOCUMENT_NOT_FOUND", 404);
        }

        const now = new Date();
        const existingAudit = doc.auditTrail || [];
        existingAudit.push({
            action: "DOCUMENT_DELETED",
            timestamp: now.toISOString(),
            userId,
            details: {
                filename: doc.originalFilename,
                status: "DELETED",
            },
        });

        await db
            .update(document)
            .set({
                isDeleted: true,
                auditTrail: existingAudit,
                updatedAt: now,
            })
            .where(eq(document.id, documentId));

        try {
            await writeAuditLog({
                organizationId,
                actorId: userId,
                projectId: doc.projectId,
                documentId,
                action: "DOCUMENT_DELETED",
                details: {
                    filename: doc.originalFilename,
                    status: "DELETED",
                },
                ipAddress,
                userAgent,
            });
        } catch (auditErr) {
            console.warn("[DocumentService] Failed to record DOCUMENT_DELETED audit log:", auditErr);
        }

        return { success: true, id: documentId };
    }
}

export const documentService = new DocumentService();

export function requireRole(membershipRole: string, allowedRoles: string[]): void {
    const role = (membershipRole || "").toUpperCase();
    const normalizedRole = role === "MEMBER" ? "REVIEWER" : role;
    if (!allowedRoles.includes(normalizedRole)) {
        throw new DocumentServiceError("You do not have permission to perform this action.", "FORBIDDEN", 403);
    }
}

export default documentService;
