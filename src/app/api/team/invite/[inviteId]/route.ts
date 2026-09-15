import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { teamService, TeamServiceError, normalizeRole } from "@/lib/services/team.service";
import { TeamValidationError } from "@/lib/validations/team";

interface RouteParams {
    params: Promise<{
        inviteId: string;
    }>;
}

/**
 * DELETE /api/team/invite/[inviteId] — Revoke a pending invitation
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { user, organizationId, membership } = await getAuthenticatedUserAndOrg(req);
        const { inviteId } = await params;

        if (!inviteId) {
            return NextResponse.json(
                { success: false, message: "Invitation ID is required" },
                { status: 400 }
            );
        }

        const currentRole = normalizeRole(membership.role);
        if (currentRole !== "OWNER" && currentRole !== "ADMIN") {
            return NextResponse.json(
                { success: false, message: "Insufficient permissions to revoke invitations" },
                { status: 403 }
            );
        }

        const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
        const userAgent = req.headers.get("user-agent");

        const result = await teamService.revokeInvite({
            actorUserId: user.id,
            inviteId,
            organizationId,
            ipAddress,
            userAgent,
        });

        return NextResponse.json({
            success: true,
            data: result,
            message: "Invitation revoked successfully",
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
        console.error("[DELETE /api/team/invite/[inviteId] error]:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Failed to revoke invitation" },
            { status: 500 }
        );
    }
}
