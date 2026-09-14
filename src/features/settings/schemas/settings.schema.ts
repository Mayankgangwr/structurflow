import { z } from "zod";

export const profileSettingsSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters."),
    lastName: z.string().min(2, "Last name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string()
        .min(8, "Password must be at least 8 characters.")
        .regex(/[A-Z]/, "Must contain at least one uppercase letter.")
        .regex(/[a-z]/, "Must contain at least one lowercase letter.")
        .regex(/[0-9]/, "Must contain at least one number.")
        .regex(/[^A-Za-z0-9]/, "Must contain at least one special character."),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
});

export const systemThresholdsSchema = z.object({
    confidenceThreshold: z.number().min(50).max(100),
    autoFlagLowConfidence: z.boolean(),
    strictSchemaValidation: z.boolean(),
    cacheTtlMinutes: z.number().min(5).max(1440),
});

export type ProfileSettingsFormData = z.infer<typeof profileSettingsSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type SystemThresholdsFormData = z.infer<typeof systemThresholdsSchema>;
