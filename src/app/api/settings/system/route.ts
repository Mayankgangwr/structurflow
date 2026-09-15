import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { settingsService } from "@/lib/services/settings.service";
import { systemThresholdsSchema } from "@/lib/validations/settings";
import { z } from "zod";

export async function GET(req: NextRequest) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);
        const systemSettings = await settingsService.getSystemSettings(organizationId);

        return NextResponse.json({
            success: true,
            message: "System settings and infrastructure health retrieved successfully",
            data: systemSettings,
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
        console.error("[GET /api/settings/system error]:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch system settings", errors: [] },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { user, organizationId, membership } = await getAuthenticatedUserAndOrg(req);
        const body = systemThresholdsSchema.parse(await req.json());

        const updatedSystemSettings = await settingsService.updateSystemSettings(
            organizationId,
            body,
            user.id,
            membership?.role
        );

        return NextResponse.json({
            success: true,
            message: "System extraction and verification thresholds updated successfully",
            data: updatedSystemSettings,
            errors: [],
        });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    message: error.issues[0]?.message ?? "Invalid system thresholds data",
                    errors: error.issues,
                },
                { status: 400 }
            );
        }
        const message = error instanceof Error ? error.message : "";
        if (message === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, message: "Unauthorized", errors: [] }, { status: 401 });
        }
        if (message === "FORBIDDEN") {
            return NextResponse.json(
                { success: false, message: "Only organization owners and admins can update system thresholds", errors: [] },
                { status: 403 }
            );
        }
        console.error("[PUT /api/settings/system error]:", error);
        return NextResponse.json(
            { success: false, message: "Failed to update system settings", errors: [] },
            { status: 500 }
        );
    }
}
