import analyticsRepository, { AnalyticsQueryOptions } from "@/repositories/analytics.repository";
import { Role } from "@/models/membership.model";

class AnalyticsService {
    async getDashboardAnalytics(organizationId: string, options: AnalyticsQueryOptions = {}, userRole?: Role) {
        const isPrivileged = userRole === Role.OWNER || userRole === Role.ADMIN;

        const [overview, timeSeries, statusDist, projectPerformance, reviewerStats, fileTypes] = await Promise.all([
            analyticsRepository.getOverviewMetrics(organizationId, options),
            analyticsRepository.getTimeSeriesThroughput(organizationId, options),
            analyticsRepository.getStatusDistribution(organizationId, options),
            analyticsRepository.getProjectPerformance(organizationId),
            // Reviewer velocity leaderboard is included for Owner & Admin, or top summary
            analyticsRepository.getReviewerEfficiency(organizationId, options.period === "7d" ? 7 : 30),
            analyticsRepository.getFileTypeDistribution(organizationId, options),
        ]);

        return {
            overview,
            timeSeries,
            statusDistribution: statusDist.distribution,
            totalStatusCount: statusDist.total,
            projects: projectPerformance,
            reviewers: isPrivileged ? reviewerStats : reviewerStats.map((r) => ({
                userId: r.userId,
                name: r.name,
                totalAudited: r.totalAudited,
                approvalRate: r.approvalRate,
            })),
            fileTypes,
        };
    }

    async getOverview(organizationId: string, options: AnalyticsQueryOptions = {}) {
        return await analyticsRepository.getOverviewMetrics(organizationId, options);
    }

    async getThroughput(organizationId: string, options: AnalyticsQueryOptions = {}) {
        return await analyticsRepository.getTimeSeriesThroughput(organizationId, options);
    }

    async getProjectPerformance(organizationId: string) {
        return await analyticsRepository.getProjectPerformance(organizationId);
    }

    async getReviewerEfficiency(organizationId: string, days = 30) {
        return await analyticsRepository.getReviewerEfficiency(organizationId, days);
    }
}

const analyticsService = new AnalyticsService();
export default analyticsService;
