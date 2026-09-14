import { z } from "zod";

export const forgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid email address."),
});

export const resetPasswordSchema = z.object({
    newPassword: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});