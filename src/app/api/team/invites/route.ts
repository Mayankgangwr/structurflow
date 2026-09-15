import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { teamService, TeamServiceError, normalizeRole } from "@/lib/services/team.service";
import { TeamValidationError } from "@/lib/validations/team";

/**
 * GET /api/team/invites — List all pending invitations for the organization
 */
export async function GET(req: NextRequest) {
    try {
        const { organizationId, membership } = await getAuthenticatedUserAndOrg(req);

        const role = normalizeRole(membership.role);
        if (role !== "OWNER" && role !== "ADMIN") {
            return NextResponse.json(
                { success: false, message: "Insufficient permissions to view team invitations" },
                { status: 403 }
            );
        }

        const invites = await teamService.getPendingInvites(organizationId);

        return NextResponse.json({
            success: true,
            data: invites,
            message: "Pending invites retrieved successfully",
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
        console.error("[GET /api/team/invites error]:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Failed to retrieve pending invites" },
            { status: 500 }
        );
    }
}
