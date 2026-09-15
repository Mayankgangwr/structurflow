import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { errorJson, json } from "@/lib/auth-route";

const bodySchema = z.object({ email: z.string().email(), type: z.enum(["email-verification", "sign-in", "forget-password"]).optional() });
const resendAttempts = new Map<string, number>();
const RESEND_COOLDOWN_MS = 60_000;

export async function POST(request: NextRequest) {
    try {
        const body = bodySchema.parse(await request.json());
        const email = body.email.toLowerCase();
        const lastAttempt = resendAttempts.get(email) ?? 0;
        if (Date.now() - lastAttempt < RESEND_COOLDOWN_MS) return errorJson("Please wait one minute before requesting another code.", 429, "OTP_RESEND_RATE_LIMITED");
        await auth.api.sendVerificationOTP({ headers: request.headers, body: { email, type: body.type ?? "email-verification" } });
        resendAttempts.set(email, Date.now());
        return json({ email, expiresIn: 5 }, "OTP resent successfully");
    } catch (error) {
        if (error instanceof z.ZodError) return errorJson("A valid email address is required");
        console.error("[POST /api/auth/resend-otp]", error);
        return errorJson("Unable to resend verification code", 400, "OTP_RESEND_FAILED");
    }
}
