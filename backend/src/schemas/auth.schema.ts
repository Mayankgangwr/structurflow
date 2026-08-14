import { z } from "zod";

export const registerSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, 'password must be at least 8 characters'),
        firstName: z.string().min(3, 'First name is required'),
        lastName: z.string().min(3, 'Last name is required'),
        organizationName: z.string().min(2, 'Organization name must be at least 2 characters').optional().or(z.literal('')),
    })
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, 'password must be at least 8 characters'),
    })
});

export const verifyOtpSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Token is required"),
        otp: z.string().length(6, "OTP must be exactly 6 characters"),
    })
});

export const resendOtpSchema = z.object({
    body: z.object({
        token: z.string().min(1, "Token is required"),
    })
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
    })
});

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Token is required'),
        newPassword: z.string().min(8, 'Password must be at least 8 characters')
            .regex(/[A-Z]/, 'Must contain uppercase')
            .regex(/[a-z]/, 'Must contain lowercase')
            .regex(/[0-9]/, 'Must contain number')
            .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
    })
});


export type LoginFormData = z.infer<typeof loginSchema.shape.body>;
export type RegisterFormData = z.infer<typeof registerSchema.shape.body>;
export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema.shape.body>;
export type ResendOtpFormData = z.infer<typeof resendOtpSchema.shape.body>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema.shape.body>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema.shape.body>;

