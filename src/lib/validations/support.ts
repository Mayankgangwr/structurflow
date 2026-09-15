import { z } from "zod";

export const createSupportTicketSchema = z.object({
    subject: z
        .string({ required_error: "Subject is required" })
        .trim()
        .min(3, "Subject must be at least 3 characters.")
        .max(150, "Subject cannot exceed 150 characters."),
    category: z.enum(
        ["general", "extraction", "templates", "billing", "api"],
        {
            errorMap: () => ({
                message: "Category must be one of: general, extraction, templates, billing, api",
            }),
        }
    ),
    priority: z.enum(
        ["low", "medium", "high", "urgent"],
        {
            errorMap: () => ({
                message: "Priority must be one of: low, medium, high, urgent",
            }),
        }
    ),
    message: z
        .string({ required_error: "Detailed message is required" })
        .trim()
        .min(10, "Message must be at least 10 characters long.")
        .max(5000, "Message cannot exceed 5000 characters."),
});

export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>;

export interface SupportTicketResponse {
    ticketId: string;
    subject: string;
    category: string;
    priority: string;
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
    createdAt: string;
    estimatedResponseTime: string;
}

export interface ServiceHealthItem {
    name: string;
    status: "Operational" | "Normal" | "Online" | "Healthy" | "Degraded" | "Offline";
    metric: string;
    description: string;
    latencyMs?: number;
}

export interface SystemHealthResponse {
    overallStatus: "OPERATIONAL" | "DEGRADED" | "OUTAGE";
    uptimePercentage: string;
    lastChecked: string;
    services: ServiceHealthItem[];
}
