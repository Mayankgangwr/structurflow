import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import teamService from "@/services/team.service";
import { ok } from "@/utils/response";
import { ApiErrors } from "@/utils/errors";

function getOrganizationId(req: Request): string {
    const rawOrgId = req.headers["x-organization-id"] || req.params.orgId || req.membership?.organization;
    const orgId = Array.isArray(rawOrgId) ? rawOrgId[0] : rawOrgId;
    if (!orgId) throw ApiErrors.orgIdRequired();
    return orgId as string;
}

export const teamController = {
    getMembers: asyncHandler(async (req: Request, res: Response) => {
        const organizationId = getOrganizationId(req);
        const members = await teamService.getMembers(organizationId);
        return ok(res, members, "Team members retrieved successfully");
    }),

    getPendingInvites: asyncHandler(async (req: Request, res: Response) => {
        const organizationId = getOrganizationId(req);
        const invites = await teamService.getPendingInvites(organizationId);
        return ok(res, invites, "Pending invites retrieved successfully");
    }),

    invite: asyncHandler(async (req: Request, res: Response) => {
        const { email, role } = req.body;
        const organizationId = getOrganizationId(req);

        const result = await teamService.inviteMember(req.user!._id, email, role, organizationId);
        return ok(res, result, "Invitation sent successfully", 201);
    }),

    updateRole: asyncHandler(async (req: Request, res: Response) => {
        const { role } = req.body;
        const userId = (Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId) as string;
        const organizationId = getOrganizationId(req);

        if (!role) {
            throw ApiErrors.badRequest("Role is required.");
        }

        const result = await teamService.updateMemberRole(req.user!._id, userId, role, organizationId);
        return ok(res, result, "Member role updated successfully");
    }),

    removeMember: asyncHandler(async (req: Request, res: Response) => {
        const userId = (Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId) as string;
        const organizationId = getOrganizationId(req);

        const result = await teamService.removeMember(req.user!._id, userId, organizationId);
        return ok(res, result, "Member removed from organization");
    }),

    revokeInvite: asyncHandler(async (req: Request, res: Response) => {
        const inviteId = (Array.isArray(req.params.inviteId) ? req.params.inviteId[0] : req.params.inviteId) as string;
        const organizationId = getOrganizationId(req);

        const result = await teamService.revokeInvite(req.user!._id, inviteId, organizationId);
        return ok(res, result, "Invitation revoked successfully");
    }),

    resendInvite: asyncHandler(async (req: Request, res: Response) => {
        const inviteId = (Array.isArray(req.params.inviteId) ? req.params.inviteId[0] : req.params.inviteId) as string;
        const organizationId = getOrganizationId(req);

        const result = await teamService.resendInvite(req.user!._id, inviteId, organizationId);
        return ok(res, result, "Invitation email resent successfully");
    }),
};