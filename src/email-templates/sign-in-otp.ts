import { renderBaseEmailLayout } from "./base-template";

export interface SignInOtpTemplateOptions {
    otp: string;
    validityMinutes?: number;
    email?: string;
}

export function renderSignInOtpEmail({
    otp,
    validityMinutes = 5,
    email,
}: SignInOtpTemplateOptions): { subject: string; html: string; text: string } {
    const title = "Sign In with One-Time Passcode";
    const subtitle = email
        ? `A request was made to sign into Structurflow with <strong>${email}</strong>. Use the code below to complete authentication:`
        : "Use the one-time code below to complete your sign-in to Structurflow:";

    const contentHtml = `
      <div style="background: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 24px; margin: 28px 0; text-align: center;">
        <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 38px; font-weight: 700; letter-spacing: 12px; color: #16a34a; display: inline-block; user-select: all;">
          ${otp}
        </div>
        <div style="margin-top: 10px; font-size: 12.5px; color: #15803d; font-weight: 500;">
          Expires in ${validityMinutes} minutes • Single-use sign-in code
        </div>
      </div>
    `;

    const html = renderBaseEmailLayout({
        title,
        subtitle,
        badgeText: "Passwordless Sign-In",
        contentHtml,
        securityNotice: "Never forward this email or read the code aloud to anyone.",
    });

    const text = `Sign in to Structurflow\n\nYour sign-in code is: ${otp}\n\nThis code expires in ${validityMinutes} minutes. If you did not request this code, please ignore this email.`;

    return {
        subject: "Your Structurflow Sign-In Code",
        html,
        text,
    };
}
