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
