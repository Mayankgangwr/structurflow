import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, otp, organizationName } = body;

        if (!email || !otp) {
            return NextResponse.json(
                { success: false, message: "Email and OTP code are required" },
                { status: 400 }
            );
        }

        const result = await auth.api.verifyEmailOTP({
            body: {
                email: email.trim().toLowerCase(),
                otp: String(otp).trim(),
            },
            headers: req.headers,
        });

        return NextResponse.json({
            success: true,
            message: "Email verified successfully",
            data: result,
        });
    } catch (error: any) {
        console.error("[verify-otp error]:", error?.message || error);
        const statusCode = typeof error?.statusCode === "number"
            ? error.statusCode
            : typeof error?.status === "number"
                ? error.status
                : 400;

        return NextResponse.json(
            {
                success: false,
                message: error?.body?.message || error?.message || "Invalid or expired OTP code",
            },
            { status: statusCode }
        );
    }
}
