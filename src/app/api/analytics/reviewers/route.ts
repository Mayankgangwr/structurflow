import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { analyticsService } from "@/lib/services/analytics.service";
import { reviewerQuerySchema } from "@/lib/validations/analytics";
import { z } from "zod";

export async function GET(req: NextRequest) {
    try {
        const { organizationId, membership } = await getAuthenticatedUserAndOrg(req);

        const searchParams = Object.fromEntries(new URL(req.url).searchParams);
        const queryOptions = reviewerQuerySchema.parse(searchParams);

        const reviewers = await analyticsService.getReviewerEfficiency(
            organizationId,
            queryOptions.days,
            membership?.role
        );

        return NextResponse.json({
            success: true,
            message: "Reviewer efficiency analytics retrieved successfully",
            data: reviewers,
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
        console.error("[GET /api/analytics/reviewers error]:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch reviewer efficiency analytics", errors: [] },
            { status: 500 }
        );
    }
}
