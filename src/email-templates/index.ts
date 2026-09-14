import { renderVerificationOtpEmail } from "./verification-otp";
import { renderResetPasswordOtpEmail } from "./reset-password-otp";
import { renderSignInOtpEmail } from "./sign-in-otp";

export * from "./base-template";
export * from "./verification-otp";
export * from "./reset-password-otp";
export * from "./sign-in-otp";

export type EmailOtpType = "email-verification" | "forget-password" | "sign-in" | "change-email";

export function getOtpEmailTemplate({
    type,
    otp,
    email,
    validityMinutes = 5,
}: {
    type: EmailOtpType | string;
    otp: string;
    email?: string;
    validityMinutes?: number;
}): { subject: string; html: string; text: string } {
    switch (type) {
        case "forget-password":
        case "reset-password":
            return renderResetPasswordOtpEmail({ otp, validityMinutes, email });
        case "sign-in":
            return renderSignInOtpEmail({ otp, validityMinutes, email });
        case "email-verification":
        case "change-email":
        default:
            return renderVerificationOtpEmail({ otp, validityMinutes, email });
    }
}
