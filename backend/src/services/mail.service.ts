import { config } from "@/config/env";
import { compileOtpEmail } from "@/templates/otp-email.template";
import { compileResetPasswordEmail } from "@/templates/reset-password.template";
import { compileTeamInviteEmail } from "@/templates/invite-email.template";
import nodemailer from "nodemailer";

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

class MailService {
    private transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_SECURE,
        auth: {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS
        }
    });


    async sendEmail(options: EmailOptions): Promise<void> {
        try {
            const mailOptions = {
                from: config.SMTP_FROM,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text
            };

            await this.transporter.sendMail(mailOptions);
        } catch (error: any) {
            console.error("Email sending failed:", error);
            // Preserve original error message so caller can surface the real failure
            const message = error?.message ? String(error.message) : "Failed to send email";
            throw new Error(message);
        }
    }

    async sendOtpEmail(to: string, otpCode: string, token: string) {
        const verificationLink = `${config.FRONTEND_URL}/verify-email?token=${token}`;
        const { subject, html, text } = compileOtpEmail({ otpCode, verificationLink });

        await this.sendEmail({ to, subject, html, text });
    }

    async sendResetPasswordEmail(to: string, token: string) {
        const resetLink = `${config.FRONTEND_URL}/reset-password?token=${token}`;
        const { subject, html, text } = compileResetPasswordEmail({ resetLink });

        await this.sendEmail({ to, subject, html, text });
    }

    async sendTeamInviteEmail(to: string, inviterName: string, orgName: string, token: string) {
        const inviteLink = `${config.FRONTEND_URL}/accept-invite?token=${token}`;
        const { subject, html, text } = compileTeamInviteEmail({ inviterName, orgName, inviteLink });

        await this.sendEmail({ to, subject, html, text });
    }
}

export const mailService = new MailService();