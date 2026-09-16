import nodemailer from "nodemailer";
import { getOtpEmailTemplate, type EmailOtpType } from "@/email-templates";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

interface SendOtpEmailParams {
    to: string;
    otp: string;
    type: EmailOtpType | string;
}

export async function sendOtpEmail({ to, otp, type }: SendOtpEmailParams) {
    const { subject, html, text } = getOtpEmailTemplate({
        type,
        otp,
        email: to,
        validityMinutes: 5,
    });

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "iammayankgangwarbly@gmail.com";

    try {
        const info = await transporter.sendMail({
            from: `"Structurflow" <${fromAddress}>`,
            to,
            subject,
            text,
            html,
        });

        console.log(`[SMTP] Successfully dispatched ${type} email to ${to}. MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error: any) {
        console.error(`[SMTP ERROR] Failed to send email to ${to}:`, error?.message || error);
        return { success: false, error: error?.message || "Failed to send email" };
    }
}

async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html: string }) {
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "iammayankgangwarbly@gmail.com";
    return transporter.sendMail({ from: `"StructurFlow" <${fromAddress}>`, to, subject, text, html });
}

export async function sendResetPasswordEmail({ to, token, appUrl }: { to: string; token: string; appUrl?: string }) {
    const base = appUrl || process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://structurflow.netlify.app";
    const resetLink = `${base}/reset-password?token=${encodeURIComponent(token)}`;
    await sendEmail({
        to,
        subject: "Reset your Structurflow password",
        text: `Reset your password: ${resetLink}. This link expires in one hour.`,
        html: `<p>Reset your Structurflow password by clicking <a href="${resetLink}" target="_blank" rel="noopener noreferrer">this secure link</a>.</p><p>If the link is not clickable, copy and paste this URL into your browser:</p><p style="word-break: break-all;"><a href="${resetLink}" target="_blank" rel="noopener noreferrer">${resetLink}</a></p><p>This link expires in one hour.</p>`,
    });
}

export async function sendTeamInviteEmail({ to, inviterName, orgName, token, appUrl }: { to: string; inviterName: string; orgName: string; token: string; appUrl?: string }) {
    const base = appUrl || process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "https://structurflow.netlify.app";
    const inviteLink = `${base}/accept-invite?token=${encodeURIComponent(token)}`;
    const subject = `You've been invited to join ${orgName} on StructurFlow`;

    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">StructurFlow</h1>
      </div>
      <h2 style="color: #111827; font-size: 20px; font-weight: 600; text-align: center;">You're Invited!</h2>
      <p style="color: #4b5563; font-size: 16px; line-height: 24px; text-align: center;"><strong>${inviterName}</strong> has invited you to join the team at <strong>${orgName}</strong>.</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteLink}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block;">Accept Invitation</a>
      </div>

      <p style="color: #6b7280; font-size: 14px; text-align: center;">Or copy and paste this link into your browser:</p>
      <p style="color: #4f46e5; font-size: 14px; text-align: center; word-break: break-all;"><a href="${inviteLink}" style="color: #4f46e5;">${inviteLink}</a></p>
      
      <p style="color: #6b7280; font-size: 14px; text-align: center; margin-top: 24px;">This invitation link will expire in <strong>3 days</strong>.</p>
      
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 32px 0;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">StructurFlow - Intelligent Document Processing</p>
    </div>
    `;

    const text = `
    You're Invited!

    ${inviterName} has invited you to join the team at ${orgName} on StructurFlow.

    To accept the invitation, please open the following link in your browser:
    ${inviteLink}

    This invitation link will expire in 3 days.

    StructurFlow - Intelligent Document Processing
    `;

    try {
        await sendEmail({ to, subject, text, html });
        return { success: true };
    } catch (err: any) {
        console.error(`[SMTP ERROR] Failed to send team invite email to ${to}:`, err?.message || err);
        return { success: false, error: err?.message || "Failed to send email" };
    }
}

export async function sendSupportTicketEmail({
    to,
    ticketId,
    subject: ticketSubject,
    category,
    priority,
    message,
    userName,
}: {
    to: string;
    ticketId: string;
    subject: string;
    category: string;
    priority: string;
    message: string;
    userName: string;
}) {
    const subject = `[Support Ticket #${ticketId}] ${ticketSubject}`;
    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eaeaea; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #4f46e5; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -1px;">StructurFlow</h1>
      </div>
      <h2 style="color: #111827; font-size: 18px; font-weight: 600;">Support Ticket Received #${ticketId}</h2>
      <p style="color: #4b5563; font-size: 14px;">Hello <strong>${userName}</strong>,</p>
      <p style="color: #4b5563; font-size: 14px;">We have received your support request and our engineering team has been notified. Here is a summary of your ticket:</p>
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Ticket ID:</strong> #${ticketId}</p>
        <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Category:</strong> ${category}</p>
        <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Priority:</strong> ${priority.toUpperCase()}</p>
        <p style="margin: 0 0 8px 0; font-size: 13px;"><strong>Subject:</strong> ${ticketSubject}</p>
        <p style="margin: 8px 0 0 0; font-size: 13px;"><strong>Details:</strong></p>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #475569; white-space: pre-wrap;">${message}</p>
      </div>
      <p style="color: #64748b; font-size: 13px;">Our support engineers typically reply within 24 hours.</p>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;">
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">StructurFlow Support Desk</p>
    </div>
    `;

    const text = `
Support Ticket Received #${ticketId}

Hello ${userName},

We have received your support ticket #${ticketId} (${ticketSubject}).
Category: ${category}
Priority: ${priority.toUpperCase()}

Message:
${message}

Our support team typically replies within 24 hours.

StructurFlow Support Desk
    `;

    try {
        await sendEmail({ to, subject, text, html });
        return { success: true };
    } catch (err: any) {
        console.warn(`[SMTP NOTICE] Failed to send support ticket email:`, err?.message || err);
        return { success: false, error: err?.message || "Failed to send email" };
    }
}

