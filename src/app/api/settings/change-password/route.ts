import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { settingsService } from "@/lib/services/settings.service";
import { changePasswordSchema } from "@/lib/validations/settings";
import { z } from "zod";

export async function POST(req: NextRequest) {
    try {
        const { user } = await getAuthenticatedUserAndOrg(req);
        const body = changePasswordSchema.parse(await req.json());

        const result = await settingsService.changePassword({
            userId: user.id,
            currentPassword: body.currentPassword,
            newPassword: body.newPassword,
            reqHeaders: req.headers,
        });

        return NextResponse.json({
            success: true,
            message: result.message,
            data: null,
            errors: [],
        });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    message: error.issues[0]?.message ?? "Invalid password data",
                    errors: error.issues,
                },
                { status: 400 }
            );
        }
        const message = error instanceof Error ? error.message : "Failed to change password";
        if (message === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, message: "Unauthorized", errors: [] }, { status: 401 });
        }
        console.error("[POST /api/settings/change-password error]:", error);
        return NextResponse.json(
            { success: false, message, errors: [] },
            { status: 400 }
        );
    }
}
