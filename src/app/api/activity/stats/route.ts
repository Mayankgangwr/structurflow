import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { activityService } from "@/lib/services/activity.service";

export async function GET(req: NextRequest) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);

        const stats = await activityService.getActivityStats(organizationId);

        return NextResponse.json({
            success: true,
            message: "Activity stats retrieved successfully",
            data: stats,
            errors: [],
        });
    } catch (error: unknown) {
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
        console.error("[GET /api/activity/stats error]:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch activity statistics", errors: [] },
            { status: 500 }
        );
    }
}
