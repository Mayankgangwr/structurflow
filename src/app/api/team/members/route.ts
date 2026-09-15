import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { teamService, TeamServiceError } from "@/lib/services/team.service";
import { TeamValidationError } from "@/lib/validations/team";

/**
 * GET /api/team/members — List all members of the organization
 */
export async function GET(req: NextRequest) {
    try {
        const { organizationId } = await getAuthenticatedUserAndOrg(req);

        const members = await teamService.getMembers(organizationId);

        return NextResponse.json({
            success: true,
            data: members,
            message: "Team members retrieved successfully",
        });
    } catch (error: any) {
        if (error?.message === "UNAUTHORIZED") {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }
        if (error?.message === "ORGANIZATION_REQUIRED") {
            return NextResponse.json({ success: false, message: "No active organization found" }, { status: 400 });
        }
        if (error instanceof TeamServiceError || error instanceof TeamValidationError) {
            return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
        }
        console.error("[GET /api/team/members error]:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Failed to retrieve team members" },
            { status: 500 }
        );
    }
}
