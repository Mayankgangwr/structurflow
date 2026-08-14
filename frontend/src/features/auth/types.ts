import { z } from "zod";
import { loginSchema, otpSchema } from "./schemas/login.schema";
import { registerSchema } from "./schemas/register.schema";
import { forgotPasswordSchema, resetPasswordSchema } from "./schemas/forgot-password.schema";
import { acceptInviteSchema } from "./schemas/accept-invite.schema";

export type LoginFormData = z.infer<typeof loginSchema>;
export type OtpFormData = z.infer<typeof otpSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type AcceptInviteFormData = z.infer<typeof acceptInviteSchema>;
