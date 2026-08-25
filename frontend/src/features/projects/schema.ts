import z from "zod"
const createProjectSchema = z.object({
    name: z.string()
        .min(3, "Project name must be at least 3 characters long")
        .max(100, "Project name must not exceed 100 characters"),
    description: z.string()
        .max(500, "Project description must not exceed 500 characters"),
    templateDocumentId: z.string()
})

const updateProjectSchema = z.object({
    name: z.string()
        .min(3, "Project name must be at least 3 characters long")
        .max(100, "Project name must not exceed 100 characters"),
    description: z.string()
        .max(500, "Project description must not exceed 500 characters")
})

export { createProjectSchema, updateProjectSchema }