import { z } from "zod";

export const supportTicketSchema = z.object({
    subject: z.string().min(3, "Subject must be at least 3 characters."),
    category: z.enum(["general", "extraction", "templates", "billing", "api"]),
    priority: z.enum(["low", "medium", "high", "urgent"]),
    message: z.string().min(10, "Message must be at least 10 characters long."),
});

export type SupportTicketFormData = z.infer<typeof supportTicketSchema>;
