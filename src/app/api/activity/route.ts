import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { activityService } from "@/lib/services/activity.service";
import { getActivityQuerySchema } from "@/lib/validations/activity";
import { z } from "zod";

export async function GET(req: NextRequest) {
    try {
        const { organizationId, membership } = await getAuthenticatedUserAndOrg(req);

        const searchParams = Object.fromEntries(new URL(req.url).searchParams);
        const queryOptions = getActivityQuerySchema.parse(searchParams);

        const result = await activityService.getActivities(
            organizationId,
            queryOptions,
            membership?.role
        );

        return NextResponse.json({
            success: true,
            message: "Activities retrieved successfully",
            data: result,
            errors: [],
        });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    message: error.issues[0]?.message ?? "Invalid query parameters",
                    errors: error.issues,
                },
                { status: 400 }
            );
        }
        const message = error instanceof Error ? error.message : "";
        if (message === "UNAUTHORIZED") {
            return NextResponse.json(
                { success: false, message: "Unauthorized", errors: [] },
                { status: 401 }
            );
        }
        if (message === "ORGANIZATION_REQUIRED") {
            return NextResponse.json(
                { success: false, message: "No active organization found", errors: [] },
                { status: 400 }
            );
        }
        console.error("[GET /api/activity error]:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch activities", errors: [] },
            { status: 500 }
        );
    }
}
