import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { settingsService } from "@/lib/services/settings.service";
import { updateProfileSchema } from "@/lib/validations/settings";
import { z } from "zod";

export async function GET(req: NextRequest) {
    try {
        const { user } = await getAuthenticatedUserAndOrg(req);
        const profile = await settingsService.getProfile(user.id);

        return NextResponse.json({
            success: true,
            message: "User profile retrieved successfully",
            data: profile,
            errors: [],
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "";
        if (message === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, message: "Unauthorized", errors: [] }, { status: 401 });
        }
        if (message === "ORGANIZATION_REQUIRED") {
            return NextResponse.json({ success: false, message: "No active organization found", errors: [] }, { status: 400 });
        }
        console.error("[GET /api/settings/profile error]:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch user profile", errors: [] },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { user } = await getAuthenticatedUserAndOrg(req);
        const body = updateProfileSchema.parse(await req.json());

        const updatedProfile = await settingsService.updateProfile(user.id, body);

        return NextResponse.json({
            success: true,
            message: "Profile updated successfully",
            data: updatedProfile,
            errors: [],
        });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    message: error.issues[0]?.message ?? "Invalid profile data",
                    errors: error.issues,
                },
                { status: 400 }
            );
        }
        const message = error instanceof Error ? error.message : "";
        if (message === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, message: "Unauthorized", errors: [] }, { status: 401 });
        }
        console.error("[PATCH /api/settings/profile error]:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update profile", errors: [] },
            { status: 500 }
        );
    }
}
