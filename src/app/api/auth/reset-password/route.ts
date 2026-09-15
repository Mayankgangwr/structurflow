import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { errorJson, json } from "@/lib/auth-route";

const bodySchema = z.object({
    token: z.string().min(1),
    newPassword: z.string().min(6),
});

export async function POST(req: NextRequest) {
    try {
        const body = bodySchema.parse(await req.json());
        const { token, newPassword } = body;

        await auth.api.resetPassword({
            body: {
                token,
                newPassword,
            },
            headers: req.headers,
        });

        return json(null, "Password reset successful");
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return errorJson("Invalid request data. Password must be at least 6 characters.");
        }
        console.error("[POST /api/auth/reset-password error]:", error);
        return errorJson(error?.body?.message || error?.message || "Invalid or expired reset token", 400, "INVALID_RESET_TOKEN");
    }
}
