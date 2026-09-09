import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiErrors } from "@/utils/errors";
import { ok } from "@/utils/response";
import activityService from "@/services/activity.service";

export const activityController = {
    list: asyncHandler(async (req: Request, res: Response) => {
        const organizationId = req.headers["x-organization-id"] as string;
        if (!organizationId) throw ApiErrors.orgIdRequired();

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const category = req.query.category as any;
        const action = req.query.action as string;
        const actorId = req.query.actorId as string;
        const search = req.query.search as string;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        const result = await activityService.getActivities(
            organizationId,
            {
                page,
                limit,
                category,
                action,
                actorId,
                search,
                startDate,
                endDate,
            },
            req.membership?.role
        );

        return ok(res, result, "Activities retrieved successfully");
    }),

    stats: asyncHandler(async (req: Request, res: Response) => {
        const organizationId = req.headers["x-organization-id"] as string;
        if (!organizationId) throw ApiErrors.orgIdRequired();

        const stats = await activityService.getActivityStats(organizationId);
        return ok(res, stats, "Activity stats retrieved successfully");
    }),
};
