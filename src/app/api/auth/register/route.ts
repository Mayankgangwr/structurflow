import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, firstName, lastName, organizationName, accountType } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: "Email and password are required" },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        // 1. Check if email is already taken
        const existing = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.email, normalizedEmail))
            .limit(1);

        if (existing.length > 0) {
            return NextResponse.json(
                { success: false, message: "This email is already in use." },
                { status: 409 }
            );
        }

        // 2. Register user through Better-Auth (which automatically dispatches OTP)
        const signUpResult = await auth.api.signUpEmail({
            body: {
                email: normalizedEmail,
                password,
                name: `${firstName || ""} ${lastName || ""}`.trim() || normalizedEmail.split("@")[0],
                firstName: firstName || "",
                lastName: lastName || "",
                accountType: accountType || "INDIVIDUAL",
            },
            headers: req.headers,
        });

        return NextResponse.json(
            {
                success: true,
                message: "Registration successful. Please verify your email with the OTP code.",
                data: {
                    email: normalizedEmail,
                    organizationName: organizationName || "",
                    expiresIn: 5,
                    user: signUpResult?.user || null,
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("[auth/register error]:", error);
        const errMsg = error?.body?.message || error?.message || "Registration failed";
        const isConflict = errMsg.toLowerCase().includes("exist") || errMsg.toLowerCase().includes("already");
        return NextResponse.json(
            { success: false, message: errMsg },
            { status: isConflict ? 409 : 400 }
        );
    }
}
