import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member, organization, user } from "@/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: "Email and password are required" },
                { status: 400 }
            );
        }

        // 1. Authenticate with Better-Auth
        let signInResult: any;
        try {
            signInResult = await auth.api.signInEmail({
                body: {
                    email: email.trim().toLowerCase(),
                    password,
                },
                headers: req.headers,
                asResponse: true,
            });
        } catch (err: any) {
            const errMsg = err?.message || err?.body?.message || "Invalid credentials";
            const isUnverified = errMsg.toLowerCase().includes("verif");
            return NextResponse.json(
                {
                    success: false,
                    message: isUnverified ? "Email not verified yet" : "Invalid email or password",
                },
                { status: isUnverified ? 403 : 401 }
            );
        }

        // Extract response JSON from Better-Auth
        let authData: any = {};
        if (signInResult instanceof Response) {
            const clone = signInResult.clone();
            authData = await clone.json().catch(() => ({}));
        } else {
            authData = signInResult;
        }

        const signedInUser = authData?.user;
        if (!signedInUser?.id) {
            return NextResponse.json(
                { success: false, message: authData?.message || "Invalid email or password" },
                { status: 401 }
            );
        }

        // 2. Fetch user's organization memberships
        const memberships = await db
            .select({
                organizationId: member.organizationId,
                role: member.role,
                orgName: organization.name,
            })
            .from(member)
            .leftJoin(organization, eq(member.organizationId, organization.id))
            .where(eq(member.userId, signedInUser.id));

        const activeOrg = memberships.length > 0
            ? { id: memberships[0].organizationId, name: memberships[0].orgName || "Default Organization" }
            : undefined;

        // 3. Build response matching AuthResponse contract in frontend
        const response = NextResponse.json({
            success: true,
            message: "Login successful",
            data: {
                user: {
                    id: signedInUser.id,
                    email: signedInUser.email,
                    firstName: signedInUser.firstName || signedInUser.name?.split(" ")[0] || "",
                    lastName: signedInUser.lastName || signedInUser.name?.split(" ").slice(1).join(" ") || "",
                },
                memberships: memberships.map((m) => ({
                    organizationId: m.organizationId,
                    role: m.role,
                })),
                organization: activeOrg,
            },
        });

        // 4. Copy cookies from Better-Auth sign-in response
        if (signInResult instanceof Response) {
            const setCookieHeader = signInResult.headers.get("set-cookie");
            if (setCookieHeader) {
                response.headers.set("set-cookie", setCookieHeader);
            }
        }

        return response;
    } catch (error: any) {
        console.error("[auth/login error]:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Internal authentication error" },
            { status: 500 }
        );
    }
}
