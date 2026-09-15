import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization, user } from "./auth-schema";
import { project } from "./project-schema";
import { document } from "./document-schema";

export const auditLog = pgTable("audit_log", {
    id: text("id").primaryKey(),
    organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    projectId: text("project_id").references(() => project.id, { onDelete: "set null" }),
    documentId: text("document_id").references(() => document.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    details: jsonb("details").$type<Record<string, unknown>>().default({}).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
    index("idx_audit_log_organization_created").on(table.organizationId, table.createdAt),
    index("idx_audit_log_organization_action").on(table.organizationId, table.action),
    index("idx_audit_log_project").on(table.projectId),
]);
