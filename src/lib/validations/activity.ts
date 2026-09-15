import { z } from "zod";

export const CATEGORY_ACTIONS: Record<string, string[]> = {
    DOCUMENTS: [
        "DOCUMENT_UPLOADED",
        "DOCUMENT_TRANSFORMED",
        "DOCUMENT_DELETED",
        "DOCUMENT_STATUS_CHANGED",
        "DOCUMENT_UPDATED",
        "UPDATE_AI_GENERATED_JSON",
        "TEMPLATE_UPLOADED",
        "TEMPLATE_PROCESSED",
        "TEMPLATE_ACTIVATED",
        "TEMPLATE_DELETED",
    ],
    VERIFICATION: [
        "DOCUMENT_VERIFIED",
        "DOCUMENT_REJECTED",
        "EXTRACTION_APPROVED",
        "EXTRACTION_REJECTED",
        "BULK_VERIFIED",
    ],
    TEAM: [
        "MEMBER_INVITED",
        "MEMBER_ROLE_UPDATED",
        "MEMBER_REMOVED",
        "INVITE_REVOKED",
        "INVITE_ACCEPTED",
        "USER_REGISTERED",
    ],
    PROJECTS: [
        "PROJECT_CREATED",
        "PROJECT_UPDATED",
        "PROJECT_DELETED",
    ],
};

export const getActivityQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    category: z.enum(["ALL", "DOCUMENTS", "VERIFICATION", "TEAM", "PROJECTS"]).optional().default("ALL"),
    action: z.string().optional(),
    actorId: z.string().optional(),
    search: z.string().trim().optional().default(""),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

export type GetActivityQueryInput = z.infer<typeof getActivityQuerySchema>;
