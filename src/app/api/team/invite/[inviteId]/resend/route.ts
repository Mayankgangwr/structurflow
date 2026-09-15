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
 * POST /api/team/invite/[inviteId]/resend — Resend a pending invitation email
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
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
                { success: false, message: "Insufficient permissions to resend invitations" },
                { status: 403 }
            );
        }

        const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
        const userAgent = req.headers.get("user-agent");

        const result = await teamService.resendInvite({
            actorUserId: user.id,
            inviteId,
            organizationId,
            ipAddress,
            userAgent,
        });

        return NextResponse.json({
            success: true,
            data: result,
            message: "Invitation email resent successfully",
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
        console.error("[POST /api/team/invite/[inviteId]/resend error]:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Failed to resend invitation email" },
            { status: 500 }
        );
    }
}
