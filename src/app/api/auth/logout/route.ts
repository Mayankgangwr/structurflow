import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const signOutResult = await auth.api.signOut({
            headers: req.headers,
            asResponse: true,
        });

        const response = NextResponse.json({
            success: true,
            data: null,
            message: "Logged out successfully",
        });

        // Pass through any cookie-clearing headers from Better-Auth
        if (signOutResult instanceof Response) {
            const setCookie = signOutResult.headers.get("set-cookie");
            if (setCookie) {
                response.headers.set("set-cookie", setCookie);
            }
        }

        return response;
    } catch (error: any) {
        console.error("[auth/logout error]:", error);
        return NextResponse.json(
            { success: true, data: null, message: "Logged out successfully" },
            { status: 200 }
        );
    }
}
