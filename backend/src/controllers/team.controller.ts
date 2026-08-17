import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import teamService from "@/services/team.service";
import { ok } from "@/utils/response";

export const teamController = {
    invite: asyncHandler(async (req: Request, res: Response) => {
        const { email, role } = req.body;
        // Assuming your auth middleware attaches the user's active organizationId to req.headers or req.user
        const organizationId = req.headers['x-organization-id'] as string;

        await teamService.inviateMamber(req.user!._id, email, role, organizationId);

        return ok(res, null, 'Invitation sent successfully', 200);
    })
}