import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, type = "email-verification" } = body;

        if (!email) {
            return NextResponse.json(
                { success: false, message: "Email is required" },
                { status: 400 }
            );
        }

        const result = await auth.api.sendVerificationOTP({
            body: {
                email: email.trim().toLowerCase(),
                type,
            },
            headers: req.headers,
        });

        return NextResponse.json({
            success: true,
            message: "Verification OTP resent successfully",
            data: result,
        });
    } catch (error: any) {
        console.error("[resend-otp error]:", error?.message || error);
        const statusCode = typeof error?.statusCode === "number"
            ? error.statusCode
            : typeof error?.status === "number"
                ? error.status
                : 500;

        return NextResponse.json(
            {
                success: false,
                message: error?.body?.message || error?.message || "Failed to resend verification OTP",
            },
            { status: statusCode }
        );
    }
}
