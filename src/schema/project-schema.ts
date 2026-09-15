import { boolean, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { organization, user } from "./auth-schema";

export const project = pgTable("project", {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
        .notNull()
        .references(() => organization.id, { onDelete: "cascade" }),
    templateDocumentId: text("template_id"),
    createdById: text("created_by_id").references(() => user.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    description: text("description").default(""),
    status: text("status").default("Active").notNull(), // "Active" | "Inactive"
    isDeleted: boolean("is_deleted").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
    index("idx_project_organization_active").on(table.organizationId, table.isDeleted, table.updatedAt),
]);
