import { redis } from "@/config/redis";
import { Role } from "@/models/membership.model";
import { InvitationStatus } from "@/models/invitation.model";
import membershipRepository from "@/repositories/membership.repository";
import organizationRepository from "@/repositories/organization.repository";
import userRepository from "@/repositories/user.repository";
import invitationRepository from "@/repositories/invitation.repository";
import { parseDurationToMs } from "@/utils/cookie";
import { ApiErrors } from "@/utils/errors";
import { generateToken } from "@/utils/generate";
import { mailService } from "./mail.service";
import auditLogRepository from "@/repositories/audit-log.repository";
import { AuditAction } from "@/models/audit-log.model";
import mongoose from "mongoose";

class TeamService {
    /**
     * Lists all active members of an organization with populated user profile.
     */
    async getMembers(organizationId: string) {
        const memberships = await membershipRepository.findAllByOrg(organizationId);

        return memberships
            .filter((m: any) => m.userId) // Ensure populated user exists
            .map((m: any) => ({
                membershipId: m._id.toString(),
                userId: m.userId._id.toString(),
                firstName: m.userId.firstName,
                lastName: m.userId.lastName,
                email: m.userId.email,
                avatar: m.userId.avatar || null,
                role: m.role as Role,
                joinedAt: m.createdAt,
                lastLoginAt: m.userId.lastLoginAt || null,
            }));
    }

    /**
     * Lists all active pending invitations for an organization.
     */
    async getPendingInvites(organizationId: string) {
        const invites = await invitationRepository.findPendingByOrg(organizationId);

        return invites.map((inv: any) => ({
            id: inv._id.toString(),
            email: inv.email,
            role: inv.role,
            status: inv.status,
            expiresAt: inv.expiresAt,
            createdAt: inv.createdAt,
            inviter: inv.inviterId
                ? {
                      id: inv.inviterId._id.toString(),
                      name: `${inv.inviterId.firstName || ""} ${inv.inviterId.lastName || ""}`.trim(),
                      email: inv.inviterId.email,
                  }
                : null,
        }));
    }

    /**
     * Invites a new member to the organization with a specified role.
     */
    async inviteMember(
        inviterUserId: string,
        email: string,
        role: Role,
        organizationId: string
    ) {
        const cleanEmail = email.toLowerCase().trim();

        // 1. Validate inviter has permission (must be OWNER or ADMIN)
        const inviterMembership = await membershipRepository.findByOrgAndUser(
            organizationId,
            inviterUserId
        );
        if (!inviterMembership || !["OWNER", "ADMIN"].includes(inviterMembership.role)) {
            throw ApiErrors.insufficientPermissions();
        }

        // 2. An ADMIN cannot invite an OWNER
        if (inviterMembership.role === "ADMIN" && role === Role.OWNER) {
            throw ApiErrors.badRequest("Only organization owners can invite new owners.");
        }

        // 3. Check if user is already a member of the organization
        const existingUser = await userRepository.findByEmail(cleanEmail);
        if (existingUser) {
            const alreadyMember = await membershipRepository.findByOrgAndUser(
                organizationId,
                existingUser._id.toString()
            );
            if (alreadyMember) throw ApiErrors.duplicateMembership();
        }

        // 4. Check if there's already an active pending invite
        const existingInvite = await invitationRepository.findPendingByOrgAndEmail(
            organizationId,
            cleanEmail
        );
        if (existingInvite) {
            throw ApiErrors.badRequest("An active invitation is already pending for this email address.");
        }

        // 5. Generate secure invite token
        const inviteToken: string = generateToken(32);
        const expiresAt = new Date(Date.now() + parseDurationToMs("3d"));

        // 6. Persist invitation record in MongoDB for auditing & queue display
        await invitationRepository.create({
            organizationId,
            email: cleanEmail,
            role,
            inviterId: inviterUserId,
            token: inviteToken,
            status: InvitationStatus.PENDING,
            expiresAt,
        });

        // 7. Save invite intent in Redis for fast verification during accept
        const inviteData = {
            email: cleanEmail,
            organizationId,
            role,
            inviterId: inviterUserId,
        };
        await redis.setJson(
            `org_invite:${inviteToken}`,
            inviteData,
            parseDurationToMs("3d")
        );

        // 8. Send Email
        const inviter = await userRepository.findById(inviterUserId);
        const org = await organizationRepository.findById(organizationId);
        await mailService.sendTeamInviteEmail(
            cleanEmail,
            inviter?.firstName || "A team member",
            org?.name || "the workspace",
            inviteToken
        );

        // Record Audit Log
        try {
            await auditLogRepository.create({
                organizationId,
                actorId: inviterUserId,
                action: AuditAction.MEMBER_INVITED,
                details: {
                    targetEmail: cleanEmail,
                    role,
                },
            });
        } catch (auditErr) {
            console.error("Failed to record audit log for MEMBER_INVITED:", auditErr);
        }

        return { email: cleanEmail, role, expiresAt };
    }

    // Backwards-compatible alias for existing controller call
    async inviateMamber(inviterUserId: string, email: string, role: Role, organizationId: string) {
        return this.inviteMember(inviterUserId, email, role, organizationId);
    }

    /**
     * Updates an existing member's role within the organization.
     */
    async updateMemberRole(
        actorUserId: string,
        targetUserId: string,
        newRole: Role,
        organizationId: string
    ) {
        // 1. Validate actor permissions
        const actorMembership = await membershipRepository.findByOrgAndUser(organizationId, actorUserId);
        if (!actorMembership || !["OWNER", "ADMIN"].includes(actorMembership.role)) {
            throw ApiErrors.insufficientPermissions();
        }

        // 2. Validate target member exists
        const targetMembership = await membershipRepository.findByOrgAndUser(organizationId, targetUserId);
        if (!targetMembership) {
            throw ApiErrors.notFound("Target member not found in this organization.");
        }

        // 3. Prevent self-demotion if the user is the only OWNER
        if (actorUserId === targetUserId && actorMembership.role === Role.OWNER && newRole !== Role.OWNER) {
            const ownerCount = await membershipRepository.countByOrgAndRole(organizationId, Role.OWNER);
            if (ownerCount <= 1) {
                throw ApiErrors.badRequest(
                    "You cannot demote yourself because you are the only Owner. Please transfer ownership to another member first."
                );
            }
        }

        // 4. Role Hierarchy rules for ADMIN:
        if (actorMembership.role === Role.ADMIN) {
            if (targetMembership.role === Role.OWNER) {
                throw ApiErrors.insufficientPermissions();
            }
            if (newRole === Role.OWNER) {
                throw ApiErrors.badRequest("Only organization owners can assign the Owner role.");
            }
            if (targetMembership.role === Role.ADMIN && actorUserId !== targetUserId) {
                throw ApiErrors.insufficientPermissions();
            }
        }

        // 5. If demoting an OWNER, verify another OWNER exists
        if (targetMembership.role === Role.OWNER && newRole !== Role.OWNER) {
            const ownerCount = await membershipRepository.countByOrgAndRole(organizationId, Role.OWNER);
            if (ownerCount <= 1) {
                throw ApiErrors.badRequest("Cannot demote the last remaining Owner of the organization.");
            }
        }

        // 6. Update role
        const previousRole = targetMembership.role;
        const updated = await membershipRepository.updateRole(organizationId, targetUserId, newRole);

        // Record Audit Log
        try {
            const targetUser = await userRepository.findById(targetUserId);
            await auditLogRepository.create({
                organizationId,
                actorId: actorUserId,
                action: AuditAction.MEMBER_ROLE_UPDATED,
                details: {
                    targetUserId,
                    targetEmail: targetUser?.email,
                    targetName: `${targetUser?.firstName || ""} ${targetUser?.lastName || ""}`.trim(),
                    previousRole,
                    newRole,
                },
            });
        } catch (auditErr) {
            console.error("Failed to record audit log for MEMBER_ROLE_UPDATED:", auditErr);
        }

        return updated;
    }

    /**
     * Removes a member from the organization.
     */
    async removeMember(actorUserId: string, targetUserId: string, organizationId: string) {
        // 1. Validate actor permissions
        const actorMembership = await membershipRepository.findByOrgAndUser(organizationId, actorUserId);
        if (!actorMembership || !["OWNER", "ADMIN"].includes(actorMembership.role)) {
            throw ApiErrors.insufficientPermissions();
        }

        // 2. Validate target member exists
        const targetMembership = await membershipRepository.findByOrgAndUser(organizationId, targetUserId);
        if (!targetMembership) {
            throw ApiErrors.notFound("Target member not found in this organization.");
        }

        // 3. An OWNER cannot be removed
        if (targetMembership.role === Role.OWNER) {
            throw ApiErrors.badRequest("Organization owners cannot be removed. Transfer ownership first.");
        }

        // 4. ADMIN cannot remove another ADMIN or OWNER
        if (actorMembership.role === Role.ADMIN && ["OWNER", "ADMIN"].includes(targetMembership.role)) {
            throw ApiErrors.insufficientPermissions();
        }

        const targetUser = await userRepository.findById(targetUserId);

        // 5. Delete membership
        await membershipRepository.deleteByOrgAndUser(organizationId, targetUserId);

        // Record Audit Log
        try {
            await auditLogRepository.create({
                organizationId,
                actorId: actorUserId,
                action: AuditAction.MEMBER_REMOVED,
                details: {
                    targetUserId,
                    targetEmail: targetUser?.email,
                    targetName: `${targetUser?.firstName || ""} ${targetUser?.lastName || ""}`.trim(),
                    role: targetMembership.role,
                },
            });
        } catch (auditErr) {
            console.error("Failed to record audit log for MEMBER_REMOVED:", auditErr);
        }

        return { success: true, removedUserId: targetUserId };
    }

    /**
     * Revokes an outstanding pending invitation.
     */
    async revokeInvite(actorUserId: string, inviteId: string, organizationId: string) {
        const actorMembership = await membershipRepository.findByOrgAndUser(organizationId, actorUserId);
        if (!actorMembership || !["OWNER", "ADMIN"].includes(actorMembership.role)) {
            throw ApiErrors.insufficientPermissions();
        }

        const invite = await invitationRepository.findById(inviteId);
        if (
            !invite ||
            invite.organizationId.toString() !== organizationId ||
            invite.status !== InvitationStatus.PENDING
        ) {
            throw ApiErrors.notFound("Active invitation not found or already processed.");
        }

        // An ADMIN cannot revoke an OWNER invite
        if (actorMembership.role === Role.ADMIN && invite.role === Role.OWNER) {
            throw ApiErrors.insufficientPermissions();
        }

        const revoked = await invitationRepository.revoke(inviteId, organizationId);
        if (!revoked) {
            throw ApiErrors.notFound("Active invitation not found or already accepted/revoked.");
        }

        // Delete from Redis
        if (revoked.token) {
            await redis.del(`org_invite:${revoked.token}`);
        }

        // Record Audit Log
        try {
            await auditLogRepository.create({
                organizationId,
                actorId: actorUserId,
                action: AuditAction.INVITE_REVOKED,
                details: {
                    inviteId,
                    targetEmail: invite.email,
                    role: invite.role,
                },
            });
        } catch (auditErr) {
            console.error("Failed to record audit log for INVITE_REVOKED:", auditErr);
        }

        return { success: true, inviteId };
    }

    /**
     * Resends an existing pending invitation email and refreshes the token expiry.
     */
    async resendInvite(actorUserId: string, inviteId: string, organizationId: string) {
        const actorMembership = await membershipRepository.findByOrgAndUser(organizationId, actorUserId);
        if (!actorMembership || !["OWNER", "ADMIN"].includes(actorMembership.role)) {
            throw ApiErrors.insufficientPermissions();
        }

        const invite = await invitationRepository.findById(inviteId);
        if (
            !invite ||
            invite.organizationId.toString() !== organizationId ||
            invite.status !== InvitationStatus.PENDING
        ) {
            throw ApiErrors.notFound("Active invitation not found or already processed.");
        }

        // An ADMIN cannot resend an OWNER invite
        if (actorMembership.role === Role.ADMIN && invite.role === Role.OWNER) {
            throw ApiErrors.insufficientPermissions();
        }

        // Refresh expiry by 3 days
        const newExpiresAt = new Date(Date.now() + parseDurationToMs("3d"));
        invite.expiresAt = newExpiresAt;
        await invite.save();

        // Refresh in Redis
        const inviteData = {
            email: invite.email,
            organizationId,
            role: invite.role,
            inviterId: actorUserId,
        };
        await redis.setJson(`org_invite:${invite.token}`, inviteData, parseDurationToMs("3d"));

        // Resend email
        const inviter = await userRepository.findById(actorUserId);
        const org = await organizationRepository.findById(organizationId);
        await mailService.sendTeamInviteEmail(
            invite.email,
            inviter?.firstName || "A team member",
            org?.name || "the workspace",
            invite.token
        );

        // Record Audit Log
        try {
            await auditLogRepository.create({
                organizationId: new mongoose.Types.ObjectId(organizationId),
                actorId: new mongoose.Types.ObjectId(actorUserId),
                action: AuditAction.MEMBER_INVITED,
                details: {
                    inviteId,
                    targetEmail: invite.email,
                    role: invite.role,
                    isResend: true,
                    status: "RESENT",
                },
            });
        } catch (auditErr) {
            console.error("Failed to record audit log for RESEND_INVITE:", auditErr);
        }

        return { success: true, email: invite.email, expiresAt: newExpiresAt };
    }
}

const teamService = new TeamService();
export default teamService;