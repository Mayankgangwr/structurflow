import crypto from "crypto";
import path from "path";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { project, template } from "@/schema";
import { writeAuditLog } from "@/lib/audit-log";
import extractPdfElements from "@/utils/extractPdfElements";
import aiService from "./ai.service";
import { supabase, BUCKET_NAME, ensureTemplatesBucket } from "@/lib/supabase";
import { toTemplateResponse, toTemplateResponses } from "@/lib/template-response";

export class TemplateServiceError extends Error {
    constructor(
        message: string,
        public code: string,
        public statusCode: number = 400
    ) {
        super(message);
        this.name = "TemplateServiceError";
        Object.setPrototypeOf(this, TemplateServiceError.prototype);
    }
}

export interface RequestMetadata {
    ipAddress?: string | null;
    userAgent?: string | null;
}

export class TemplateService {
    /**
     * Upload a new master template file, extract its schema and HTML placeholders via Gemini AI,
     * save to Supabase Storage and Neon DB, and activate it for the project.
     */
    async uploadTemplate(params: {
        organizationId: string;
        userId: string;
        projectId: string;
        file: File;
        metadata?: RequestMetadata;
    }) {
        const { organizationId, userId, projectId, file, metadata } = params;
        let storagePath: string | null = null;

        // Verify project existence and ownership
        const projectRecord = await db
            .select({ id: project.id })
            .from(project)
            .where(and(
                eq(project.id, projectId),
                eq(project.organizationId, organizationId),
                eq(project.isDeleted, false)
            ))
            .limit(1);

        if (!projectRecord[0]) {
            throw new TemplateServiceError("Project not found.", "PROJECT_NOT_FOUND", 404);
        }

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

        // Check for duplicate active uploads
        const duplicate = await db
            .select({ id: template.id })
            .from(template)
            .where(and(
                eq(template.organizationId, organizationId),
                eq(template.projectId, projectId),
                eq(template.fileHash, fileHash),
                eq(template.isDeleted, false)
            ))
            .limit(1);

        if (duplicate[0]) {
            throw new TemplateServiceError(
                "This template has already been uploaded to the project.",
                "DUPLICATE_TEMPLATE",
                409
            );
        }

        const extension = path.extname(file.name).toLowerCase() || ".bin";
        storagePath = `${organizationId}/${projectId}/${crypto.randomUUID()}${extension}`;

        await ensureTemplatesBucket();
        const upload = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, fileBuffer, { contentType: file.type, upsert: false });

        if (upload.error) {
            throw new Error(`Storage upload failed: ${upload.error.message}`);
        }

        try {
            // Extract the pdf layout
            const rawExtractedElements = await extractPdfElements({ fileBuffer });

            if (rawExtractedElements === null) {
                throw new TemplateServiceError("Failed to extract document elements", "DOCUMENT_EXTRACTION_FAILED", 500);
            }

            // AI processes the extracted PDF AST directly:
            const { schema, extractedElements } = await aiService.processExtractedElements(rawExtractedElements);

            // Deactivate any existing active templates for this project
            await db
                .update(template)
                .set({ isActive: false, updatedAt: new Date() })
                .where(and(
                    eq(template.organizationId, organizationId),
                    eq(template.projectId, projectId),
                    eq(template.isDeleted, false)
                ));

            const templateId = `tmpl_${crypto.randomUUID().replace(/-/g, "")}`;
            const inserted = await db
                .insert(template)
                .values({
                    id: templateId,
                    organizationId,
                    projectId,
                    uploadedById: userId,
                    originalFileName: file.name,
                    mimeType: file.type,
                    sizeBytes: file.size,
                    fileHash,
                    publicId: storagePath,
                    secureUrl: "",
                    status: "READY",
                    pageCount: extractedElements.pageCount ?? 1,
                    extractedElements: extractedElements,
                    templateSchema: schema,
                    processingProgress: {
                        stage: "COMPLETED",
                        percentage: 100,
                        message: "Template uploaded and analyzed successfully.",
                    },
                    version: 1,
                    isActive: true,
                    isDeleted: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();

            const record = inserted[0];

            // Link to project
            await db
                .update(project)
                .set({ templateDocumentId: record.id, updatedAt: new Date() })
                .where(and(
                    eq(project.id, projectId),
                    eq(project.organizationId, organizationId),
                    eq(project.isDeleted, false)
                ));

            // Audit log
            await writeAuditLog({
                organizationId,
                actorId: userId,
                projectId,
                action: "TEMPLATE_UPLOADED",
                details: {
                    templateId: record.id,
                    originalFileName: record.originalFileName,
                    sizeBytes: record.sizeBytes,
                    status: record.status,
                },
                ipAddress: metadata?.ipAddress,
                userAgent: metadata?.userAgent,
            });

            return {
                document: await toTemplateResponse(record),
                warnings: [],
            };
        } catch (error) {
            // Clean up uploaded storage asset on failure
            if (storagePath) {
                await supabase.storage.from(BUCKET_NAME).remove([storagePath]).catch(() => undefined);
            }
            throw error;
        }
    }

    /**
     * Reprocess an existing template with Gemini AI
     */
    async processTemplate(params: {
        organizationId: string;
        userId: string;
        templateId: string;
        metadata?: RequestMetadata;
    }) {
        const { organizationId, userId, templateId, metadata } = params;

        const found = await db
            .select()
            .from(template)
            .where(and(
                eq(template.id, templateId),
                eq(template.organizationId, organizationId),
                eq(template.isDeleted, false)
            ))
            .limit(1);

        const record = found[0];
        if (!record) {
            throw new TemplateServiceError("Template not found.", "TEMPLATE_NOT_FOUND", 404);
        }

        // Set status to PROCESSING
        await db
            .update(template)
            .set({
                status: "PROCESSING",
                processingError: null,
                processingProgress: { stage: "EXTRACTION", percentage: 20, message: "Analyzing template…" },
                updatedAt: new Date(),
            })
            .where(eq(template.id, record.id));

        try {
            const download = await supabase.storage.from(BUCKET_NAME).download(record.publicId);
            if (download.error || !download.data) {
                throw new Error("Unable to retrieve the template file from storage.");
            }

            const fileBuffer = Buffer.from(await download.data.arrayBuffer());
            const rawExtractedElements = await extractPdfElements({ fileBuffer });

            if (rawExtractedElements === null) {
                throw new TemplateServiceError("Failed to extract document elements", "DOCUMENT_EXTRACTION_FAILED", 500);
            }

            const { schema, extractedElements } = await aiService.processExtractedElements(rawExtractedElements);

            const updated = await db
                .update(template)
                .set({
                    status: "READY",
                    pageCount: extractedElements.pageCount ?? record.pageCount ?? 1,
                    templateSchema: schema,
                    extractedElements: extractedElements,
                    processingProgress: { stage: "COMPLETED", percentage: 100, message: "Template processed successfully." },
                    updatedAt: new Date(),
                })
                .where(and(
                    eq(template.id, record.id),
                    eq(template.organizationId, organizationId)
                ))
                .returning();

            await writeAuditLog({
                organizationId,
                actorId: userId,
                projectId: record.projectId,
                action: "TEMPLATE_PROCESSED",
                details: {
                    templateId: record.id,
                    originalFileName: record.originalFileName,
                    fieldsDetected: schema.fields.length,
                    status: "READY",
                },
                ipAddress: metadata?.ipAddress,
                userAgent: metadata?.userAgent,
            });

            return {
                template: await toTemplateResponse(updated[0]),
                warnings: [],
            };
        } catch (error: any) {
            await db
                .update(template)
                .set({
                    status: "FAILED",
                    processingError: error.message,
                    processingProgress: {
                        stage: "FIELD_DETECTION",
                        percentage: 0,
                        message: `Processing failed: ${error.message}`,
                    },
                    updatedAt: new Date(),
                })
                .where(eq(template.id, record.id));

            throw error;
        }
    }

    /**
     * List all templates across the entire organization
     */
    async listOrgTemplates(organizationId: string) {
        const records = await db
            .select()
            .from(template)
            .where(and(
                eq(template.organizationId, organizationId),
                eq(template.isDeleted, false)
            ))
            .orderBy(desc(template.createdAt));

        return await toTemplateResponses(records);
    }

    /**
     * List all templates belonging to a specific project
     */
    async listProjectTemplates(organizationId: string, projectId: string) {
        // Verify project ownership
        const projectRecord = await db
            .select({ id: project.id })
            .from(project)
            .where(and(
                eq(project.id, projectId),
                eq(project.organizationId, organizationId),
                eq(project.isDeleted, false)
            ))
            .limit(1);

        if (!projectRecord[0]) {
            throw new TemplateServiceError("Project not found.", "PROJECT_NOT_FOUND", 404);
        }

        const records = await db
            .select()
            .from(template)
            .where(and(
                eq(template.projectId, projectId),
                eq(template.organizationId, organizationId),
                eq(template.isDeleted, false)
            ))
            .orderBy(desc(template.createdAt));

        return await toTemplateResponses(records);
    }

    /**
     * Get the active template for a given project
     */
    async getActiveProjectTemplate(organizationId: string, projectId: string) {
        // Verify project ownership
        const projectRecord = await db
            .select({ id: project.id })
            .from(project)
            .where(and(
                eq(project.id, projectId),
                eq(project.organizationId, organizationId),
                eq(project.isDeleted, false)
            ))
            .limit(1);

        if (!projectRecord[0]) {
            throw new TemplateServiceError("Project not found.", "PROJECT_NOT_FOUND", 404);
        }

        const activeRecords = await db
            .select()
            .from(template)
            .where(and(
                eq(template.projectId, projectId),
                eq(template.organizationId, organizationId),
                eq(template.isActive, true),
                eq(template.isDeleted, false)
            ))
            .limit(1);

        if (!activeRecords[0]) {
            return null;
        }

        return await toTemplateResponse(activeRecords[0]);
    }

    /**
     * Get a single template by ID
     */
    async getTemplateById(organizationId: string, templateId: string) {
        const found = await db
            .select()
            .from(template)
            .where(and(
                eq(template.id, templateId),
                eq(template.organizationId, organizationId),
                eq(template.isDeleted, false)
            ))
            .limit(1);

        if (!found[0]) {
            return null;
        }

        return {
            document: await toTemplateResponse(found[0]),
            auditTrail: [],
        };
    }

    /**
     * Set a template as active for its project
     */
    async setActiveTemplate(params: {
        organizationId: string;
        userId: string;
        templateId: string;
        projectId: string;
        metadata?: RequestMetadata;
    }) {
        const { organizationId, userId, templateId, projectId, metadata } = params;

        const found = await db
            .select()
            .from(template)
            .where(and(
                eq(template.id, templateId),
                eq(template.organizationId, organizationId),
                eq(template.isDeleted, false)
            ))
            .limit(1);

        const record = found[0];
        if (!record) {
            throw new TemplateServiceError("Template not found.", "TEMPLATE_NOT_FOUND", 404);
        }

        if (record.projectId !== projectId) {
            throw new TemplateServiceError(
                "Template does not belong to the specified project.",
                "INVALID_PROJECT",
                400
            );
        }

        // Deactivate other templates for this project
        await db
            .update(template)
            .set({ isActive: false, updatedAt: new Date() })
            .where(and(
                eq(template.projectId, projectId),
                eq(template.organizationId, organizationId),
                eq(template.isDeleted, false)
            ));

        // Activate this template
        await db
            .update(template)
            .set({ isActive: true, updatedAt: new Date() })
            .where(eq(template.id, templateId));

        // Link to project
        await db
            .update(project)
            .set({ templateDocumentId: templateId, updatedAt: new Date() })
            .where(and(
                eq(project.id, projectId),
                eq(project.organizationId, organizationId),
                eq(project.isDeleted, false)
            ));

        // Audit log
        await writeAuditLog({
            organizationId,
            actorId: userId,
            projectId,
            action: "TEMPLATE_ACTIVATED",
            details: { templateId: record.id, originalFileName: record.originalFileName },
            ipAddress: metadata?.ipAddress,
            userAgent: metadata?.userAgent,
        });

        return { id: templateId, projectId, isActive: true };
    }

    /**
     * Soft-delete a template and remove from Supabase Storage
     */
    async deleteTemplate(params: {
        organizationId: string;
        userId: string;
        templateId: string;
        metadata?: RequestMetadata;
    }) {
        const { organizationId, userId, templateId, metadata } = params;

        const found = await db
            .select()
            .from(template)
            .where(and(
                eq(template.id, templateId),
                eq(template.organizationId, organizationId),
                eq(template.isDeleted, false)
            ))
            .limit(1);

        const record = found[0];
        if (!record) {
            return null;
        }

        // Remove from Supabase Storage
        try {
            await supabase.storage.from(BUCKET_NAME).remove([record.publicId]);
        } catch (storageError) {
            console.error("[Supabase delete warning]:", storageError);
        }

        // Soft delete in database
        await db
            .update(template)
            .set({ isDeleted: true, isActive: false, updatedAt: new Date() })
            .where(eq(template.id, templateId));

        // Unlink from project if it was active
        await db
            .update(project)
            .set({ templateDocumentId: null, updatedAt: new Date() })
            .where(and(
                eq(project.id, record.projectId),
                eq(project.organizationId, organizationId),
                eq(project.templateDocumentId, record.id)
            ));

        // Audit log
        await writeAuditLog({
            organizationId,
            actorId: userId,
            projectId: record.projectId,
            action: "TEMPLATE_DELETED",
            details: { templateId: record.id, originalFileName: record.originalFileName },
            ipAddress: metadata?.ipAddress,
            userAgent: metadata?.userAgent,
        });

        return { id: record.id };
    }
}

export const templateService = new TemplateService();
