import crypto from "crypto";
import { and, count, desc, eq, inArray, gt } from "drizzle-orm";
import { db } from "@/lib/db";
import { invitation, member, organization, user } from "@/schema";
import { writeAuditLog } from "@/lib/audit-log";
import { sendTeamInviteEmail } from "@/lib/email";
import { RoleEnumType } from "@/lib/validations/team";

export class TeamServiceError extends Error {
    constructor(
        message: string,
        public code: string = "TEAM_ERROR",
        public statusCode: number = 400
    ) {
        super(message);
        this.name = "TeamServiceError";
        Object.setPrototypeOf(this, TeamServiceError.prototype);
    }
}

export function normalizeRole(role?: string | null): RoleEnumType {
    if (!role) return "VIEWER";
    const upper = role.trim().toUpperCase();
    if (upper === "OWNER") return "OWNER";
    if (upper === "ADMIN") return "ADMIN";
    if (upper === "REVIEWER" || upper === "MEMBER") return "REVIEWER";
    return "VIEWER";
}

export class TeamService {
    /**
     * Lists all active members of an organization with populated user profiles.
     */
    async getMembers(organizationId: string) {
        const rows = await db
            .select({
                membershipId: member.id,
                userId: user.id,
                name: user.name,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                avatar: user.image,
                role: member.role,
                joinedAt: member.createdAt,
            })
            .from(member)
            .innerJoin(user, eq(member.userId, user.id))
            .where(eq(member.organizationId, organizationId))
            .orderBy(desc(member.createdAt));

        return rows.map((m) => {
            const firstName = m.firstName || (m.name ? m.name.split(" ")[0] : "");
            const lastName = m.lastName || (m.name ? m.name.split(" ").slice(1).join(" ") : "");

            return {
                membershipId: m.membershipId,
                userId: m.userId,
                firstName,
                lastName,
                email: m.email,
                avatar: m.avatar || null,
                role: normalizeRole(m.role),
                joinedAt: m.joinedAt instanceof Date ? m.joinedAt.toISOString() : new Date(m.joinedAt).toISOString(),
                lastLoginAt: null as string | null,
            };
        });
    }

    /**
     * Lists all active pending invitations for an organization.
     */
    async getPendingInvites(organizationId: string) {
        const now = new Date();
        const rows = await db
            .select({
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                status: invitation.status,
                expiresAt: invitation.expiresAt,
                createdAt: invitation.createdAt,
                inviterId: user.id,
                inviterName: user.name,
                inviterFirstName: user.firstName,
                inviterLastName: user.lastName,
                inviterEmail: user.email,
            })
            .from(invitation)
            .leftJoin(user, eq(invitation.inviterId, user.id))
            .where(
                and(
                    eq(invitation.organizationId, organizationId),
                    inArray(invitation.status, ["pending", "PENDING"]),
                    gt(invitation.expiresAt, now)
                )
            )
            .orderBy(desc(invitation.createdAt));

        return rows.map((inv) => {
            let inviterObj = null;
            if (inv.inviterId) {
                const inviterName =
                    `${inv.inviterFirstName || ""} ${inv.inviterLastName || ""}`.trim() ||
                    inv.inviterName ||
                    inv.inviterEmail ||
                    "Team Member";
                inviterObj = {
                    id: inv.inviterId,
                    name: inviterName,
                    email: inv.inviterEmail || "",
                };
            }

            return {
                id: inv.id,
                email: inv.email,
                role: normalizeRole(inv.role),
                status: "PENDING" as const,
                expiresAt: inv.expiresAt instanceof Date ? inv.expiresAt.toISOString() : new Date(inv.expiresAt).toISOString(),
                createdAt: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : new Date(inv.createdAt).toISOString(),
                inviter: inviterObj,
            };
        });
    }

    /**
     * Invites a new member to the organization with a specified role.
     */
    async inviteMember(params: {
        inviterUserId: string;
        email: string;
        role: RoleEnumType;
        organizationId: string;
        ipAddress?: string | null;
        userAgent?: string | null;
    }) {
        const { inviterUserId, email, role, organizationId, ipAddress, userAgent } = params;
        const cleanEmail = email.toLowerCase().trim();

        // 1. Validate inviter permissions (must be OWNER or ADMIN in the organization)
        const [inviterMember] = await db
            .select()
            .from(member)
            .where(and(eq(member.organizationId, organizationId), eq(member.userId, inviterUserId)))
            .limit(1);

        if (!inviterMember) {
            throw new TeamServiceError("You are not a member of this organization.", "FORBIDDEN", 403);
        }

        const inviterRole = normalizeRole(inviterMember.role);
        if (inviterRole !== "OWNER" && inviterRole !== "ADMIN") {
            throw new TeamServiceError("Insufficient permissions to invite team members.", "FORBIDDEN", 403);
        }

        // 2. An ADMIN cannot invite an OWNER
        if (inviterRole === "ADMIN" && role === "OWNER") {
            throw new TeamServiceError("Only organization owners can invite new owners.", "BAD_REQUEST", 400);
        }

        // 3. Check if user is already a member of the organization
        const [existingUser] = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.email, cleanEmail))
            .limit(1);

        if (existingUser) {
            const [alreadyMember] = await db
                .select({ id: member.id })
                .from(member)
                .where(and(eq(member.organizationId, organizationId), eq(member.userId, existingUser.id)))
                .limit(1);

            if (alreadyMember) {
                throw new TeamServiceError("This user is already a member of the organization.", "DUPLICATE_MEMBERSHIP", 409);
            }
        }

        // 4. Check if an active pending invite already exists
        const now = new Date();
        const [existingInvite] = await db
            .select({ id: invitation.id })
            .from(invitation)
            .where(
                and(
                    eq(invitation.organizationId, organizationId),
                    eq(invitation.email, cleanEmail),
                    inArray(invitation.status, ["pending", "PENDING"]),
                    gt(invitation.expiresAt, now)
                )
            )
            .limit(1);

        if (existingInvite) {
            throw new TeamServiceError("An active invitation is already pending for this email address.", "ACTIVE_INVITE_EXISTS", 400);
        }

        // 5. Generate secure invite token and set 3-day expiry
        const inviteToken = crypto.randomBytes(24).toString("hex");
        const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

        // 6. Persist invitation record in Neon DB
        await db.insert(invitation).values({
            id: inviteToken,
            organizationId,
            email: cleanEmail,
            role,
            status: "pending",
            expiresAt,
            inviterId: inviterUserId,
            createdAt: now,
        });

        // 7. Send invitation email
        const [inviterUser] = await db.select().from(user).where(eq(user.id, inviterUserId)).limit(1);
        const [org] = await db.select().from(organization).where(eq(organization.id, organizationId)).limit(1);

        const inviterName =
            `${inviterUser?.firstName || ""} ${inviterUser?.lastName || ""}`.trim() ||
            inviterUser?.name ||
            "A team member";
        const orgName = org?.name || "the workspace";

        await sendTeamInviteEmail({
            to: cleanEmail,
            inviterName,
            orgName,
            token: inviteToken,
        });

        // 8. Record audit log
        try {
            await writeAuditLog({
                organizationId,
                actorId: inviterUserId,
                action: "MEMBER_INVITED",
                details: {
                    targetEmail: cleanEmail,
                    role,
                },
                ipAddress,
                userAgent,
            });
        } catch (auditErr) {
            console.warn("[TeamService] Failed to record MEMBER_INVITED audit log:", auditErr);
        }

        return {
            email: cleanEmail,
            role,
            expiresAt: expiresAt.toISOString(),
        };
    }

    /**
     * Updates an existing member's role within the organization.
     */
    async updateMemberRole(params: {
        actorUserId: string;
        targetUserId: string;
        newRole: RoleEnumType;
        organizationId: string;
        ipAddress?: string | null;
        userAgent?: string | null;
    }) {
        const { actorUserId, targetUserId, newRole, organizationId, ipAddress, userAgent } = params;

        // 1. Validate actor permissions
        const [actorMember] = await db
            .select()
            .from(member)
            .where(and(eq(member.organizationId, organizationId), eq(member.userId, actorUserId)))
            .limit(1);

        if (!actorMember) {
            throw new TeamServiceError("You are not a member of this organization.", "FORBIDDEN", 403);
        }

        const actorRole = normalizeRole(actorMember.role);
        if (actorRole !== "OWNER" && actorRole !== "ADMIN") {
            throw new TeamServiceError("Insufficient permissions to update member roles.", "FORBIDDEN", 403);
        }

        // 2. Validate target member exists in the organization
        const [targetMember] = await db
            .select()
            .from(member)
            .where(and(eq(member.organizationId, organizationId), eq(member.userId, targetUserId)))
            .limit(1);

        if (!targetMember) {
            throw new TeamServiceError("Target member not found in this organization.", "MEMBER_NOT_FOUND", 404);
        }

        const targetRole = normalizeRole(targetMember.role);

        // 3. Prevent self-demotion if the user is the only OWNER
        if (actorUserId === targetUserId && actorRole === "OWNER" && newRole !== "OWNER") {
            const ownerCountRes = await db
                .select({ count: count() })
                .from(member)
                .where(and(eq(member.organizationId, organizationId), inArray(member.role, ["owner", "OWNER"])));

            const ownerCount = ownerCountRes[0]?.count || 0;
            if (ownerCount <= 1) {
                throw new TeamServiceError(
                    "You cannot demote yourself because you are the only Owner. Please transfer ownership to another member first.",
                    "SOLE_OWNER_DEMOTION",
                    400
                );
            }
        }

        // 4. Role Hierarchy rules for ADMIN:
        if (actorRole === "ADMIN") {
            if (targetRole === "OWNER") {
                throw new TeamServiceError("Administrators cannot change an Owner's role.", "FORBIDDEN", 403);
            }
            if (newRole === "OWNER") {
                throw new TeamServiceError("Only organization owners can assign the Owner role.", "BAD_REQUEST", 400);
            }
            if (targetRole === "ADMIN" && actorUserId !== targetUserId) {
                throw new TeamServiceError("Administrators cannot change another Administrator's role.", "FORBIDDEN", 403);
            }
        }

        // 5. If demoting an OWNER, verify another OWNER exists
        if (targetRole === "OWNER" && newRole !== "OWNER") {
            const ownerCountRes = await db
                .select({ count: count() })
                .from(member)
                .where(and(eq(member.organizationId, organizationId), inArray(member.role, ["owner", "OWNER"])));

            const ownerCount = ownerCountRes[0]?.count || 0;
            if (ownerCount <= 1) {
                throw new TeamServiceError("Cannot demote the last remaining Owner of the organization.", "SOLE_OWNER_DEMOTION", 400);
            }
        }

        // 6. Update role (store lowercase to match Better-Auth conventions)
        const updatedRoleValue = newRole.toLowerCase();
        await db
            .update(member)
            .set({ role: updatedRoleValue })
            .where(eq(member.id, targetMember.id));

        // 7. Record audit log
        try {
            const [targetUser] = await db.select().from(user).where(eq(user.id, targetUserId)).limit(1);
            await writeAuditLog({
                organizationId,
                actorId: actorUserId,
                action: "MEMBER_ROLE_UPDATED",
                details: {
                    targetUserId,
                    targetEmail: targetUser?.email,
                    targetName: `${targetUser?.firstName || ""} ${targetUser?.lastName || ""}`.trim() || targetUser?.name,
                    previousRole: targetRole,
                    newRole,
                },
                ipAddress,
                userAgent,
            });
        } catch (auditErr) {
            console.warn("[TeamService] Failed to record MEMBER_ROLE_UPDATED audit log:", auditErr);
        }

        return {
            membershipId: targetMember.id,
            userId: targetUserId,
            role: newRole,
        };
    }

    /**
     * Removes a member from the organization.
     */
    async removeMember(params: {
        actorUserId: string;
        targetUserId: string;
        organizationId: string;
        ipAddress?: string | null;
        userAgent?: string | null;
    }) {
        const { actorUserId, targetUserId, organizationId, ipAddress, userAgent } = params;

        // 1. Validate actor permissions
        const [actorMember] = await db
            .select()
            .from(member)
            .where(and(eq(member.organizationId, organizationId), eq(member.userId, actorUserId)))
            .limit(1);

        if (!actorMember) {
            throw new TeamServiceError("You are not a member of this organization.", "FORBIDDEN", 403);
        }

        const actorRole = normalizeRole(actorMember.role);
        if (actorRole !== "OWNER" && actorRole !== "ADMIN") {
            throw new TeamServiceError("Insufficient permissions to remove organization members.", "FORBIDDEN", 403);
        }

        // 2. Validate target member exists
        const [targetMember] = await db
            .select()
            .from(member)
            .where(and(eq(member.organizationId, organizationId), eq(member.userId, targetUserId)))
            .limit(1);

        if (!targetMember) {
            throw new TeamServiceError("Target member not found in this organization.", "MEMBER_NOT_FOUND", 404);
        }

        const targetRole = normalizeRole(targetMember.role);

        // 3. An OWNER cannot be removed
        if (targetRole === "OWNER") {
            throw new TeamServiceError("Organization owners cannot be removed. Transfer ownership first.", "BAD_REQUEST", 400);
        }

        // 4. ADMIN cannot remove another ADMIN
        if (actorRole === "ADMIN" && targetRole === "ADMIN") {
            throw new TeamServiceError("Administrators cannot remove other administrators.", "FORBIDDEN", 403);
        }

        const [targetUser] = await db.select().from(user).where(eq(user.id, targetUserId)).limit(1);

        // 5. Delete membership
        await db
            .delete(member)
            .where(and(eq(member.organizationId, organizationId), eq(member.userId, targetUserId)));

        // 6. Record audit log
        try {
            await writeAuditLog({
                organizationId,
                actorId: actorUserId,
                action: "MEMBER_REMOVED",
                details: {
                    targetUserId,
                    targetEmail: targetUser?.email,
                    targetName: `${targetUser?.firstName || ""} ${targetUser?.lastName || ""}`.trim() || targetUser?.name,
                    role: targetRole,
                },
                ipAddress,
                userAgent,
            });
        } catch (auditErr) {
            console.warn("[TeamService] Failed to record MEMBER_REMOVED audit log:", auditErr);
        }

        return { success: true, removedUserId: targetUserId };
    }

    /**
     * Revokes an outstanding pending invitation.
     */
    async revokeInvite(params: {
        actorUserId: string;
        inviteId: string;
        organizationId: string;
        ipAddress?: string | null;
        userAgent?: string | null;
    }) {
        const { actorUserId, inviteId, organizationId, ipAddress, userAgent } = params;

        // 1. Validate actor permissions
        const [actorMember] = await db
            .select()
            .from(member)
            .where(and(eq(member.organizationId, organizationId), eq(member.userId, actorUserId)))
            .limit(1);

        if (!actorMember) {
            throw new TeamServiceError("You are not a member of this organization.", "FORBIDDEN", 403);
        }

        const actorRole = normalizeRole(actorMember.role);
        if (actorRole !== "OWNER" && actorRole !== "ADMIN") {
            throw new TeamServiceError("Insufficient permissions to revoke invitations.", "FORBIDDEN", 403);
        }

        // 2. Validate invite exists and is pending
        const [invite] = await db
            .select()
            .from(invitation)
            .where(
                and(
                    eq(invitation.id, inviteId),
                    eq(invitation.organizationId, organizationId),
                    inArray(invitation.status, ["pending", "PENDING"])
                )
            )
            .limit(1);

        if (!invite) {
            throw new TeamServiceError("Active invitation not found or already processed.", "INVITE_NOT_FOUND", 404);
        }

        // 3. ADMIN cannot revoke an OWNER invite
        const inviteRole = normalizeRole(invite.role);
        if (actorRole === "ADMIN" && inviteRole === "OWNER") {
            throw new TeamServiceError("Administrators cannot revoke Owner invitations.", "FORBIDDEN", 403);
        }

        // 4. Mark invite as revoked
        await db
            .update(invitation)
            .set({ status: "revoked" })
            .where(eq(invitation.id, inviteId));

        // 5. Record audit log
        try {
            await writeAuditLog({
                organizationId,
                actorId: actorUserId,
                action: "INVITE_REVOKED",
                details: {
                    inviteId,
                    targetEmail: invite.email,
                    role: inviteRole,
                },
                ipAddress,
                userAgent,
            });
        } catch (auditErr) {
            console.warn("[TeamService] Failed to record INVITE_REVOKED audit log:", auditErr);
        }

        return { success: true, inviteId };
    }

    /**
     * Resends an existing pending invitation email and refreshes the token expiry.
     */
    async resendInvite(params: {
        actorUserId: string;
        inviteId: string;
        organizationId: string;
        ipAddress?: string | null;
        userAgent?: string | null;
    }) {
        const { actorUserId, inviteId, organizationId, ipAddress, userAgent } = params;

        // 1. Validate actor permissions
        const [actorMember] = await db
            .select()
            .from(member)
            .where(and(eq(member.organizationId, organizationId), eq(member.userId, actorUserId)))
            .limit(1);

        if (!actorMember) {
            throw new TeamServiceError("You are not a member of this organization.", "FORBIDDEN", 403);
        }

        const actorRole = normalizeRole(actorMember.role);
        if (actorRole !== "OWNER" && actorRole !== "ADMIN") {
            throw new TeamServiceError("Insufficient permissions to resend invitations.", "FORBIDDEN", 403);
        }

        // 2. Validate invite exists and is pending
        const [invite] = await db
            .select()
            .from(invitation)
            .where(
                and(
                    eq(invitation.id, inviteId),
                    eq(invitation.organizationId, organizationId),
                    inArray(invitation.status, ["pending", "PENDING"])
                )
            )
            .limit(1);

        if (!invite) {
            throw new TeamServiceError("Active invitation not found or already processed.", "INVITE_NOT_FOUND", 404);
        }

        // 3. ADMIN cannot resend an OWNER invite
        const inviteRole = normalizeRole(invite.role);
        if (actorRole === "ADMIN" && inviteRole === "OWNER") {
            throw new TeamServiceError("Administrators cannot resend Owner invitations.", "FORBIDDEN", 403);
        }

        // 4. Refresh expiry by 3 days
        const newExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        await db
            .update(invitation)
            .set({ expiresAt: newExpiresAt })
            .where(eq(invitation.id, inviteId));

        // 5. Resend email
        const [inviterUser] = await db.select().from(user).where(eq(user.id, actorUserId)).limit(1);
        const [org] = await db.select().from(organization).where(eq(organization.id, organizationId)).limit(1);

        const inviterName =
            `${inviterUser?.firstName || ""} ${inviterUser?.lastName || ""}`.trim() ||
            inviterUser?.name ||
            "A team member";
        const orgName = org?.name || "the workspace";

        await sendTeamInviteEmail({
            to: invite.email,
            inviterName,
            orgName,
            token: invite.id,
        });

        // 6. Record audit log
        try {
            await writeAuditLog({
                organizationId,
                actorId: actorUserId,
                action: "MEMBER_INVITED",
                details: {
                    inviteId,
                    targetEmail: invite.email,
                    role: inviteRole,
                    isResend: true,
                    status: "RESENT",
                },
                ipAddress,
                userAgent,
            });
        } catch (auditErr) {
            console.warn("[TeamService] Failed to record RESEND_INVITE audit log:", auditErr);
        }

        return {
            success: true,
            email: invite.email,
            expiresAt: newExpiresAt.toISOString(),
        };
    }
}

export const teamService = new TeamService();
