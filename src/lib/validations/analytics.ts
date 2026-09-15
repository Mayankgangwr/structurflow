import { z } from "zod";

export const analyticsQuerySchema = z.object({
    period: z.enum(["7d", "30d", "90d", "all"]).optional().default("30d"),
    projectId: z.string().optional(),
});

export const reviewerQuerySchema = z.object({
    days: z.coerce.number().int().min(1).max(365).optional().default(30),
});

export type AnalyticsQueryInput = {
    period?: "7d" | "30d" | "90d" | "all";
    projectId?: string;
};

export type ReviewerQueryInput = {
    days?: number;
};
