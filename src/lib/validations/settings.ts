import { z } from "zod";

export const updateProfileSchema = z.object({
    firstName: z.string().trim().min(1, "First name is required").max(50),
    lastName: z.string().trim().min(1, "Last name is required").max(50),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(/[A-Z]/, "Must contain at least one uppercase letter")
            .regex(/[a-z]/, "Must contain at least one lowercase letter")
            .regex(/[0-9]/, "Must contain at least one number")
            .regex(/[^A-Za-z0-9]/, "Must contain at least one special character"),
        confirmPassword: z.string().min(1, "Confirm password is required"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "New passwords do not match",
        path: ["confirmPassword"],
    });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const updateOrganizationSchema = z.object({
    name: z.string().trim().min(2, "Organization name must be at least 2 characters").max(100),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;

export const systemThresholdsSchema = z.object({
    confidenceThreshold: z.number().min(50).max(100).default(85),
    autoFlagLowConfidence: z.boolean().default(true),
    strictSchemaValidation: z.boolean().default(true),
    cacheTtlMinutes: z.number().min(5).max(1440).default(60),
});

export type SystemThresholdsInput = z.infer<typeof systemThresholdsSchema>;
