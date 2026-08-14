import { config } from "@/config/env";

export type OtpEmailParams = {
  otpCode: string;
  verificationLink: string;
};

export function compileOtpEmail(params: OtpEmailParams): { subject: string; html: string; text: string } {
  const { otpCode, verificationLink } = params;
  const subject = "Verify your StructurFlow Account";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">StructurFlow</h1>
      </div>
      <h2 style="color: #111827; font-size: 20px; font-weight: 600; text-align: center;">Welcome aboard!</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 24px; text-align: center;">We're thrilled to have you. Please verify your email address by clicking the button below:</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${verificationLink}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block;">Verify Email Address</a>
      </div>

      <p style="color: #4b5563; font-size: 14px; text-align: center;">Or enter this code manually:</p>

      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin: 16px 0 32px 0;">
        <span style="font-size: 32px; font-weight: 700; color: #4f46e5; letter-spacing: 4px;">${otpCode}</span>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; text-align: center;">This code will expire in <strong>${config.OTP_TTL_MINUTES} minutes</strong>.</p>
      <p style="color: #6b7280; font-size: 14px; text-align: center;">If you didn't create an account with StructurFlow, you can safely ignore this email.</p>
      
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 32px 0;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">StructurFlow - Intelligent Document Processing</p>
    </div>
  `;

  const text = `
    Welcome to StructurFlow!

    Your verification code is: ${otpCode}

    This code will expire in ${config.OTP_TTL_MINUTES} minutes.

    If you didn't request this code, please ignore this email.

    StructurFlow - Intelligent Document Processing
  `;

  return { subject, html, text };
}
