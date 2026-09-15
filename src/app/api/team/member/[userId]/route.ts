import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { teamService, TeamServiceError, normalizeRole } from "@/lib/services/team.service";
import { TeamValidationError } from "@/lib/validations/team";

interface RouteParams {
    params: Promise<{
        userId: string;
    }>;
}

/**
 * DELETE /api/team/member/[userId] — Remove a member from the organization
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { user, organizationId, membership } = await getAuthenticatedUserAndOrg(req);
        const { userId } = await params;

        if (!userId) {
            return NextResponse.json(
                { success: false, message: "User ID is required" },
                { status: 400 }
            );
        }

        const currentRole = normalizeRole(membership.role);
        if (currentRole !== "OWNER" && currentRole !== "ADMIN") {
            return NextResponse.json(
                { success: false, message: "Insufficient permissions to remove organization members" },
                { status: 403 }
            );
        }

        const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
        const userAgent = req.headers.get("user-agent");

        const result = await teamService.removeMember({
            actorUserId: user.id,
            targetUserId: userId,
            organizationId,
            ipAddress,
            userAgent,
        });

        return NextResponse.json({
            success: true,
            data: result,
            message: "Member removed from organization",
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
        console.error("[DELETE /api/team/member/[userId] error]:", error);
        return NextResponse.json(
            { success: false, message: error?.message || "Failed to remove member" },
            { status: 500 }
        );
    }
}
