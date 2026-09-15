import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { invitation, organization, user } from "@/schema";
import { eq } from "drizzle-orm";
import { errorJson, json } from "@/lib/auth-route";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await context.params;

        if (!token) {
            return errorJson("Invitation token is required", 400);
        }

        const [invite] = await db
            .select({
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                status: invitation.status,
                expiresAt: invitation.expiresAt,
                organizationId: invitation.organizationId,
                organizationName: organization.name,
            })
            .from(invitation)
            .leftJoin(organization, eq(invitation.organizationId, organization.id))
            .where(eq(invitation.id, token))
            .limit(1);

        if (!invite) {
            return errorJson("Invalid or expired invitation link", 404, "INVITE_NOT_FOUND");
        }

        if (invite.status !== "pending" && invite.status !== "PENDING") {
            return errorJson("This invitation has already been accepted or revoked", 400, "INVITE_INACTIVE");
        }

        if (new Date(invite.expiresAt) < new Date()) {
            return errorJson("This invitation has expired", 400, "INVITE_EXPIRED");
        }

        // Check if a user with this email is already registered
        const existingUser = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.email, invite.email.toLowerCase()))
            .limit(1);

        return json({
            email: invite.email,
            isRegistered: existingUser.length > 0,
            organizationName: invite.organizationName || "an organization",
            role: invite.role || "member",
        }, "Invite info fetched successfully");
    } catch (error: any) {
        console.error("[GET /api/auth/invite-info/[token] error]:", error);
        return errorJson(error?.message || "Failed to fetch invite information", 500);
    }
}
