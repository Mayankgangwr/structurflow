import { teamController } from "@/controllers/team.controller";
import { requireAuth } from "@/middlewares/auth.middleware";
import { requireRole } from "@/middlewares/role.middleware";
import { validateRequest } from "@/middlewares/validate.middleware";
import { inviteMemberSchema, updateRoleSchema } from "@/schemas/team.schema";
import { Role } from "@/models/membership.model";
import { Router } from "express";

const teamRouter = Router();

// All team routes require authentication
teamRouter.use(requireAuth);

// Members & Invites listing (accessible to any authenticated org member)
teamRouter.get("/members", requireRole(), teamController.getMembers);
teamRouter.get("/invites", requireRole(Role.OWNER, Role.ADMIN), teamController.getPendingInvites);

// Management actions (OWNER and ADMIN only)
teamRouter.post(
    "/invite",
    requireRole(Role.OWNER, Role.ADMIN),
    validateRequest(inviteMemberSchema),
    teamController.invite
);
teamRouter.put(
    "/member/:userId/role",
    requireRole(Role.OWNER, Role.ADMIN),
    validateRequest(updateRoleSchema),
    teamController.updateRole
);
teamRouter.delete(
    "/member/:userId",
    requireRole(Role.OWNER, Role.ADMIN),
    teamController.removeMember
);
teamRouter.delete(
    "/invite/:inviteId",
    requireRole(Role.OWNER, Role.ADMIN),
    teamController.revokeInvite
);
teamRouter.post(
    "/invite/:inviteId/resend",
    requireRole(Role.OWNER, Role.ADMIN),
    teamController.resendInvite
);

// Backwards-compatible POST / for previous invite endpoint
teamRouter.post(
    "/",
    requireRole(Role.OWNER, Role.ADMIN),
    validateRequest(inviteMemberSchema),
    teamController.invite
);

export default teamRouter;