import { db } from "@/lib/db";
import { auditLog } from "@/schema";

export type AuditAction =
    | "PROJECT_CREATED"
    | "PROJECT_UPDATED"
    | "PROJECT_DELETED"
    | "TEMPLATE_UPLOADED"
    | "TEMPLATE_PROCESSED"
    | "TEMPLATE_ACTIVATED"
    | "TEMPLATE_DELETED"
    | "DOCUMENT_UPLOADED"
    | "DOCUMENT_TRANSFORMED"
    | "DOCUMENT_VERIFIED"
    | "DOCUMENT_REJECTED"
    | "DOCUMENT_STATUS_CHANGED"
    | "DOCUMENT_UPDATED"
    | "UPDATE_AI_GENERATED_JSON"
    | "DOCUMENT_DELETED"
    | "BULK_VERIFIED"
    | "MEMBER_INVITED"
    | "MEMBER_ROLE_UPDATED"
    | "MEMBER_REMOVED"
    | "INVITE_REVOKED";

interface WriteAuditLogInput {
    organizationId: string;
    actorId: string;
    projectId?: string;
    documentId?: string;
    action: AuditAction;
    details: Record<string, unknown>;
    ipAddress?: string | null;
    userAgent?: string | null;
}

export async function writeAuditLog(input: WriteAuditLogInput) {
    await db.insert(auditLog).values({
        id: `audit_${crypto.randomUUID().replace(/-/g, "")}`,
        ...input,
        projectId: input.projectId ?? null,
        documentId: input.documentId ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        createdAt: new Date(),
    });
}
