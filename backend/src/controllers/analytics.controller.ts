import { Request, Response } from "express";
import { asyncHandler } from "@/utils/asyncHandler";
import { ApiErrors } from "@/utils/errors";
import { ok } from "@/utils/response";
import analyticsService from "@/services/analytics.service";

export const analyticsController = {
    getDashboard: asyncHandler(async (req: Request, res: Response) => {
        const organizationId = req.headers["x-organization-id"] as string;
        if (!organizationId) throw ApiErrors.orgIdRequired();

        const period = (req.query.period as any) || "30d";
        const projectId = req.query.projectId as string;

        const data = await analyticsService.getDashboardAnalytics(
            organizationId,
            { period, projectId },
            req.membership?.role
        );

        return ok(res, data, "Analytics dashboard data retrieved successfully");
    }),

    getOverview: asyncHandler(async (req: Request, res: Response) => {
        const organizationId = req.headers["x-organization-id"] as string;
        if (!organizationId) throw ApiErrors.orgIdRequired();

        const period = (req.query.period as any) || "30d";
        const projectId = req.query.projectId as string;

        const overview = await analyticsService.getOverview(organizationId, { period, projectId });
        return ok(res, overview, "Analytics overview retrieved successfully");
    }),

    getThroughput: asyncHandler(async (req: Request, res: Response) => {
        const organizationId = req.headers["x-organization-id"] as string;
        if (!organizationId) throw ApiErrors.orgIdRequired();

        const period = (req.query.period as any) || "30d";
        const projectId = req.query.projectId as string;

        const throughput = await analyticsService.getThroughput(organizationId, { period, projectId });
        return ok(res, throughput, "Analytics throughput time series retrieved successfully");
    }),

    getProjects: asyncHandler(async (req: Request, res: Response) => {
        const organizationId = req.headers["x-organization-id"] as string;
        if (!organizationId) throw ApiErrors.orgIdRequired();

        const projects = await analyticsService.getProjectPerformance(organizationId);
        return ok(res, projects, "Project performance analytics retrieved successfully");
    }),

    getReviewers: asyncHandler(async (req: Request, res: Response) => {
        const organizationId = req.headers["x-organization-id"] as string;
        if (!organizationId) throw ApiErrors.orgIdRequired();

        const days = parseInt(req.query.days as string) || 30;
        const reviewers = await analyticsService.getReviewerEfficiency(organizationId, days);
        return ok(res, reviewers, "Reviewer efficiency analytics retrieved successfully");
    }),
};
