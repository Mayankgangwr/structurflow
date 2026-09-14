import { renderBaseEmailLayout } from "./base-template";

export interface VerificationOtpTemplateOptions {
    otp: string;
    validityMinutes?: number;
    email?: string;
}

export function renderVerificationOtpEmail({
    otp,
    validityMinutes = 5,
    email,
}: VerificationOtpTemplateOptions): { subject: string; html: string; text: string } {
    const title = "Verify Your Email Address";
    const subtitle = email
        ? `We received a request to verify your account for <strong>${email}</strong>. Use the 6-digit verification code below:`
        : "Please enter the one-time verification code below to verify your email address and activate your account:";

    const contentHtml = `
      <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; margin: 28px 0; text-align: center;">
        <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 38px; font-weight: 700; letter-spacing: 12px; color: #1877f2; display: inline-block; user-select: all;">
          ${otp}
        </div>
        <div style="margin-top: 10px; font-size: 12.5px; color: #94a3b8; font-weight: 500;">
          Expires in ${validityMinutes} minutes • Single-use only
        </div>
      </div>
    `;

    const html = renderBaseEmailLayout({
        title,
        subtitle,
        badgeText: "Email Verification",
        contentHtml,
        securityNotice: "Never share your 6-digit code with anyone. Structurflow staff will never request it.",
    });

    const text = `Verify Your Structurflow Email\n\nYour 6-digit verification code is: ${otp}\n\nThis code is valid for ${validityMinutes} minutes. If you did not request this code, please ignore this email.`;

    return {
        subject: "Your Structurflow Email Verification Code",
        html,
        text,
    };
}
