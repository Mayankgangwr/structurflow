import { pgTable, text, timestamp, integer, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { organization, user } from "./auth-schema";
import { project } from "./project-schema";

export type DocumentStatus =
    | "UPLOADED"
    | "PROCESSING"
    | "REVIEW_REQUIRED"
    | "TRUSTED"
    | "TRANSFORMED"
    | "VERIFIED"
    | "REJECTED"
    | "FAILED"
    | "EXPORTED";

export interface DocumentAuditEntry {
    action: string;
    timestamp: string;
    userId?: string;
    details?: Record<string, any> | string;
}

export const document = pgTable(
    "document",
    {
        id: text("id").primaryKey(),
        organizationId: text("organization_id")
            .notNull()
            .references(() => organization.id, { onDelete: "cascade" }),
        projectId: text("project_id")
            .notNull()
            .references(() => project.id, { onDelete: "cascade" }),
        uploadedById: text("uploaded_by_id").references(() => user.id, {
            onDelete: "set null",
        }),

        // File metadata
        originalFilename: text("original_filename").notNull(),
        mimeType: text("mime_type").notNull(),
        sizeBytes: integer("size_bytes").notNull(),
        fileHash: text("file_hash"),

        // Supabase Storage
        publicId: text("public_id").notNull(), // storage path
        secureUrl: text("secure_url").notNull(),

        // Lifecycle & status
        status: text("status").default("UPLOADED").notNull(), // DocumentStatus
        processingDetails: jsonb("processing_details"),
        auditTrail: jsonb("audit_trail").$type<DocumentAuditEntry[]>().default([]),
        rejectionReason: text("rejection_reason"),
        transformedPdfUrl: text("transformed_pdf_url"),

        // Flags
        isDeleted: boolean("is_deleted").default(false).notNull(),

        // Timestamps
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        // Project documents lookup
        index("idx_document_project").on(table.projectId, table.isDeleted),

        // Organization documents lookup
        index("idx_document_organization").on(table.organizationId, table.isDeleted),

        // Status filter lookup
        index("idx_document_status").on(table.status, table.isDeleted),
    ]
);
