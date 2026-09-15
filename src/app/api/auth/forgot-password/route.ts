import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { errorJson, json } from "@/lib/auth-route";

const bodySchema = z.object({
    email: z.string().email(),
});

export async function POST(req: NextRequest) {
    try {
        const body = bodySchema.parse(await req.json());
        const email = body.email.trim().toLowerCase();

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000";

        await auth.api.requestPasswordReset({
            body: {
                email,
                redirectTo: `${appUrl}/reset-password`,
            },
            headers: req.headers,
        });

        // Always return success for security (prevents user enumeration)
        return json(null, "If an account exists, a reset link was sent.");
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return errorJson("A valid email address is required");
        }
        console.error("[POST /api/auth/forgot-password error]:", error);
        // Silent success for security
        return json(null, "If an account exists, a reset link was sent.");
    }
}
