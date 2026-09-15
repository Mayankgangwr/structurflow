import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { analyticsService } from "@/lib/services/analytics.service";

export async function GET(req: NextRequest) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);

        const projects = await analyticsService.getProjectPerformance(organizationId);

        return NextResponse.json({
            success: true,
            message: "Project performance analytics retrieved successfully",
            data: projects,
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
        console.error("[GET /api/analytics/projects error]:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch project analytics", errors: [] },
            { status: 500 }
        );
    }
}
