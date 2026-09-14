import { renderBaseEmailLayout } from "./base-template";

export interface ResetPasswordOtpTemplateOptions {
    otp: string;
    validityMinutes?: number;
    email?: string;
}

export function renderResetPasswordOtpEmail({
    otp,
    validityMinutes = 5,
    email,
}: ResetPasswordOtpTemplateOptions): { subject: string; html: string; text: string } {
    const title = "Reset Your Password";
    const subtitle = email
        ? `We received a password reset request for <strong>${email}</strong>. Enter the verification code below to reset your password:`
        : "Enter the one-time verification code below to confirm your password reset request:";

    const contentHtml = `
      <div style="background: #fff7ed; border: 2px dashed #fdba74; border-radius: 12px; padding: 24px; margin: 28px 0; text-align: center;">
        <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 38px; font-weight: 700; letter-spacing: 12px; color: #ea580c; display: inline-block; user-select: all;">
          ${otp}
        </div>
        <div style="margin-top: 10px; font-size: 12.5px; color: #9a3412; font-weight: 500;">
          Expires in ${validityMinutes} minutes • Do not share with anyone
        </div>
      </div>
    `;

    const html = renderBaseEmailLayout({
        title,
        subtitle,
        badgeText: "Password Reset",
        contentHtml,
        securityNotice: "If you did not request a password reset, please change your password immediately as your account may be compromised.",
    });

    const text = `Reset Your Structurflow Password\n\nYour password reset code is: ${otp}\n\nThis code will expire in ${validityMinutes} minutes. If you did not request this, please secure your account immediately.`;

    return {
        subject: "Reset Your Structurflow Password",
        html,
        text,
    };
}
