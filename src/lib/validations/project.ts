import { z } from "zod";

export const createProjectSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "Project name must be at least 3 characters long")
        .max(100, "Project name must not exceed 100 characters"),
    description: z
        .string()
        .trim()
        .max(500, "Project description must not exceed 500 characters")
        .optional()
        .default(""),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(3, "Project name must be at least 3 characters long")
            .max(100, "Project name must not exceed 100 characters")
            .optional(),
        description: z
            .string()
            .trim()
            .max(500, "Project description must not exceed 500 characters")
            .optional(),
        status: z.enum(["Active", "Inactive"]).optional(),
    })
    .refine((value) => Object.keys(value).length > 0, "Provide at least one project field to update.");

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const getProjectsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    search: z.string().trim().optional().default(""),
    status: z.string().optional().default("ALL"),
    sortBy: z.enum(["createdAt", "updatedAt", "name", "lastActivity"]).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type GetProjectsQueryInput = z.infer<typeof getProjectsQuerySchema>;
