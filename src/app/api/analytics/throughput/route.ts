import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { analyticsService } from "@/lib/services/analytics.service";
import { analyticsQuerySchema } from "@/lib/validations/analytics";
import { z } from "zod";

export async function GET(req: NextRequest) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);

        const searchParams = Object.fromEntries(new URL(req.url).searchParams);
        const queryOptions = analyticsQuerySchema.parse(searchParams);

        const throughput = await analyticsService.getTimeSeriesThroughput(
            organizationId,
            queryOptions
        );

        return NextResponse.json({
            success: true,
            message: "Analytics throughput time series retrieved successfully",
            data: throughput,
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
        console.error("[GET /api/analytics/throughput error]:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch throughput metrics", errors: [] },
            { status: 500 }
        );
    }
}
