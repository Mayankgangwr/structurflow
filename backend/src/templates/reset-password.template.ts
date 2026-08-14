import { config } from "@/config/env";

export type ResetPasswordEmailParams = {
  resetLink: string;
};

export function compileResetPasswordEmail(params: ResetPasswordEmailParams): { subject: string; html: string; text: string } {
  const { resetLink } = params;
  const subject = "Reset your StructurFlow Password";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">StructurFlow</h1>
      </div>
      <h2 style="color: #111827; font-size: 20px; font-weight: 600; text-align: center;">Reset your password</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 24px; text-align: center;">You requested to reset your password. Click the button below to choose a new one:</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetLink}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a>
      </div>

      <p style="color: #6b7280; font-size: 14px; text-align: center;">This link will expire in <strong>15 minutes</strong>.</p>
      <p style="color: #6b7280; font-size: 14px; text-align: center;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 32px 0;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">StructurFlow - Intelligent Document Processing</p>
    </div>
  `;

  const text = `
    Reset your StructurFlow Password

    You requested to reset your password. Click the link below to choose a new one:

    ${resetLink}

    This link will expire in 15 minutes.

    If you didn't request a password reset, please ignore this email.

    StructurFlow - Intelligent Document Processing
  `;

  return { subject, html, text };
}
