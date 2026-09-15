import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { analyticsService } from "@/lib/services/analytics.service";
import { analyticsQuerySchema } from "@/lib/validations/analytics";
import { z } from "zod";

export async function GET(req: NextRequest) {
    try {
        const { organizationId, membership } = await getAuthenticatedUserAndOrg(req);

        const searchParams = Object.fromEntries(new URL(req.url).searchParams);
        const queryOptions = analyticsQuerySchema.parse(searchParams);

        const data = await analyticsService.getDashboardAnalytics(
            organizationId,
            queryOptions,
            membership?.role
        );

        return NextResponse.json({
            success: true,
            message: "Analytics dashboard data retrieved successfully",
            data,
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
        console.error("[GET /api/analytics/dashboard error]:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch analytics dashboard data", errors: [] },
            { status: 500 }
        );
    }
}
