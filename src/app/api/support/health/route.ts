import { NextResponse } from "next/server";
import { supportService } from "@/lib/services/support.service";

export async function GET() {
    try {
        const health = await supportService.getSystemHealth();

        return NextResponse.json({
            success: true,
            data: health,
        });
    } catch (error) {
        console.error("[GET /api/support/health error]:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Unable to retrieve system health status",
                data: {
                    overallStatus: "DEGRADED",
                    uptimePercentage: "99.90%",
                    lastChecked: new Date().toISOString(),
                    services: [],
                },
            },
            { status: 500 }
        );
    }
}
