import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { settingsService } from "@/lib/services/settings.service";
import { updateOrganizationSchema } from "@/lib/validations/settings";
import { z } from "zod";

export async function GET(req: NextRequest) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);
        const orgSettings = await settingsService.getOrganizationSettings(organizationId);

        return NextResponse.json({
            success: true,
            message: "Organization settings retrieved successfully",
            data: orgSettings,
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
        console.error("[GET /api/settings/organization error]:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch organization settings", errors: [] },
            { status: 500 }
        );
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { user, organizationId, membership } = await getAuthenticatedUserAndOrg(req);
        const body = updateOrganizationSchema.parse(await req.json());

        const updatedOrg = await settingsService.updateOrganizationSettings(
            organizationId,
            body,
            user.id,
            membership?.role
        );

        return NextResponse.json({
            success: true,
            message: "Organization settings updated successfully",
            data: updatedOrg,
            errors: [],
        });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    message: error.issues[0]?.message ?? "Invalid organization data",
                    errors: error.issues,
                },
                { status: 400 }
            );
        }
        const message = error instanceof Error ? error.message : "Failed to update organization settings";
        if (message === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, message: "Unauthorized", errors: [] }, { status: 401 });
        }
        if (message === "FORBIDDEN") {
            return NextResponse.json(
                { success: false, message: "Only organization owners and admins can update workspace settings", errors: [] },
                { status: 403 }
            );
        }
        console.error("[PATCH /api/settings/organization error]:", error);
        return NextResponse.json(
            { success: false, message, errors: [] },
            { status: 500 }
        );
    }
}
