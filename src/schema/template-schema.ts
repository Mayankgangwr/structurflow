import { pgTable, text, timestamp, integer, boolean, jsonb, real, index, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { organization, user } from "./auth-schema";
import { project } from "./project-schema";

// ─── TypeScript Interfaces (matching Mongoose model) ───────────────────────

export type TemplateStatus = "UPLOADED" | "PROCESSING" | "READY" | "FAILED";

export type TemplateProcessingStage =
    | "UPLOAD"
    | "EXTRACTION"
    | "HTML_GENERATION"
    | "FIELD_DETECTION"
    | "SCHEMA_GENERATION"
    | "VALIDATION"
    | "COMPLETED";

export interface TemplateProcessingProgress {
    stage: TemplateProcessingStage;
    percentage: number;
    message?: string;
}

export interface TemplateExtractedData {
    text: string;
    pages?: number;
    metadata?: Record<string, unknown>;
}

export type TemplateFieldType =
    | "string"
    | "number"
    | "date"
    | "boolean"
    | "currency";

export interface TemplateField {
    fieldName: string;
    label: string;
    type: TemplateFieldType;
    required: boolean;
    placeholder: string;
    originalValue?: string;
    description?: string;
}

export interface TemplateSchemaDefinition {
    version: number;
    fields: TemplateField[];
}

// ─── Drizzle Table ─────────────────────────────────────────────────────────

export const template = pgTable("template", {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    projectId: text("project_id")
        .notNull()
        .references(() => project.id, { onDelete: "cascade" }),
    uploadedById: text("uploaded_by_id")
        .references(() => user.id, { onDelete: "set null" }),

    // ── Original File Metadata ──
    originalFileName: text("original_file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    fileHash: text("file_hash").notNull(),

    // ── Supabase Storage ──
    publicId: text("public_id").notNull(),     // storage path / public ID in bucket
    secureUrl: text("secure_url").notNull(),    // signed or public URL

    // ── Processing ──
    status: text("status").default("UPLOADED").notNull(), // UPLOADED | PROCESSING | READY | FAILED
    processingProgress: jsonb("processing_progress").$type<TemplateProcessingProgress>(),
    processingError: text("processing_error"),

    // ── PDF Information ──
    pageCount: integer("page_count"),
    pageWidth: real("page_width"),
    pageHeight: real("page_height"),

    // ── Extracted / Generated Content ──
    extractedData: jsonb("extracted_data").$type<TemplateExtractedData>(),
    htmlContent: text("html_content"),
    templateSchema: jsonb("template_schema").$type<TemplateSchemaDefinition>(),
    extractedElements: jsonb("extracted_elements"), // Raw PDF AST elements

    // ── Version ──
    version: integer("version").default(1).notNull(),

    // ── Flags ──
    isActive: boolean("is_active").default(false).notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),

    // ── Timestamps ──
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
    // Get templates for a project (excluding soft-deleted)
    index("idx_template_project").on(table.projectId, table.isDeleted),

    // Get templates for an organization (excluding soft-deleted)
    index("idx_template_organization").on(table.organizationId, table.isDeleted),

    // Find templates by processing status
    index("idx_template_status").on(table.status, table.isDeleted),

    // Active template lookup
    index("idx_template_active").on(table.isActive, table.isDeleted),

    // Prevent duplicate active uploads (same file in same project)
    uniqueIndex("unique_active_template_upload")
        .on(table.organizationId, table.projectId, table.fileHash)
        .where(sql`is_deleted = false`),
]);
