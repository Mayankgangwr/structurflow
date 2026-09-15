import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { dashboardService } from "@/lib/services/dashboard.service";
import { dashboardQuerySchema } from "@/lib/validations/dashboard";
import { z } from "zod";

export async function GET(req: NextRequest) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);

        const searchParams = Object.fromEntries(new URL(req.url).searchParams);
        const queryOptions = dashboardQuerySchema.parse(searchParams);

        const data = await dashboardService.getMissionControlDashboard(
            organizationId,
            queryOptions
        );

        return NextResponse.json({
            success: true,
            message: "Dashboard mission control data retrieved successfully",
            data,
            errors: [],
        });
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    success: false,
                    message: error.issues[0]?.message ?? "Invalid dashboard query parameters",
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

        console.error("[GET /api/dashboard error]:", error);
        return NextResponse.json(
            { success: false, message: "Failed to fetch dashboard data", errors: [] },
            { status: 500 }
        );
    }
}
