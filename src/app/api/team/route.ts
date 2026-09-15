import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserAndOrg } from "@/lib/session";
import { teamService, TeamServiceError, normalizeRole } from "@/lib/services/team.service";
import { validateInviteMember, TeamValidationError } from "@/lib/validations/team";

/**
 * GET /api/team — Backwards-compatible member list
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
        return NextResponse.json({ success: false, message: error?.message || "Failed to retrieve members" }, { status: 500 });
    }
}

/**
 * POST /api/team — Backwards-compatible invite endpoint
 */
export async function POST(req: NextRequest) {
    try {
        const { user, organizationId, membership } = await getAuthenticatedUserAndOrg(req);

        const currentRole = normalizeRole(membership.role);
        if (currentRole !== "OWNER" && currentRole !== "ADMIN") {
            return NextResponse.json(
                { success: false, message: "Insufficient permissions to invite team members" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const validated = validateInviteMember(body);

        const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
        const userAgent = req.headers.get("user-agent");

        const result = await teamService.inviteMember({
            inviterUserId: user.id,
            email: validated.email,
            role: validated.role,
            organizationId,
            ipAddress,
            userAgent,
        });

        return NextResponse.json(
            {
                success: true,
                data: result,
                message: "Invitation sent successfully",
            },
            { status: 201 }
        );
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
        return NextResponse.json({ success: false, message: error?.message || "Failed to send invitation" }, { status: 500 });
    }
}
