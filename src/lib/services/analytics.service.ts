import { db } from "@/lib/db";
import { document, project, template, auditLog, user } from "@/schema";
import { and, eq, gte, inArray, sql, desc, isNotNull } from "drizzle-orm";
import type { AnalyticsQueryInput } from "@/lib/validations/analytics";

export interface AnalyticsOverview {
    totalDocuments: number;
    totalAllTime: number;
    verifiedDocuments: number;
    rejectedDocuments: number;
    backlogCount: number;
    accuracyRate: number;
    storageBytes: number;
    trends: {
        documentsDelta: number;
        verifiedDelta: number;
        accuracyDelta: number;
    };
}

export interface TimeSeriesPoint {
    date: string;
    uploaded: number;
    transformed: number;
    verified: number;
    rejected: number;
}

export interface StatusDistributionItem {
    status: string;
    count: number;
    percentage: number;
}

export interface ProjectPerformanceItem {
    id: string;
    name: string;
    description: string;
    templateName: string | null;
    totalDocuments: number;
    verifiedCount: number;
    rejectedCount: number;
    backlogCount: number;
    successRate: number;
    storageBytes: number;
    lastActivity: string;
}

export interface ReviewerStatItem {
    userId: string;
    name: string;
    email?: string;
    avatar?: string | null;
    totalAudited: number;
    approvedCount?: number;
    rejectedCount?: number;
    approvalRate: number;
    lastActive?: string;
}

export interface FileTypeItem {
    mimeType: string;
    label: string;
    count: number;
    totalBytes: number;
    percentage: number;
}

export interface DashboardAnalyticsData {
    overview: AnalyticsOverview;
    timeSeries: TimeSeriesPoint[];
    statusDistribution: StatusDistributionItem[];
    totalStatusCount: number;
    projects: ProjectPerformanceItem[];
    reviewers: ReviewerStatItem[];
    fileTypes: FileTypeItem[];
}

export class AnalyticsService {
    private getPeriodDays(period?: string): number {
        switch (period) {
            case "7d":
                return 7;
            case "90d":
                return 90;
            case "all":
                return 365;
            case "30d":
            default:
                return 30;
        }
    }

    /**
     * Aggregates executive KPI metrics and period-over-period trend deltas.
     */
    async getOverviewMetrics(
        organizationId: string,
        options: AnalyticsQueryInput = {}
    ): Promise<AnalyticsOverview> {
        const days = this.getPeriodDays(options.period);
        const isAll = options.period === "all";

        const now = new Date();
        const currentPeriodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const prevPeriodStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);

        const conditions = [
            eq(document.organizationId, organizationId),
            eq(document.isDeleted, false),
        ];

        if (options.projectId && options.projectId !== "ALL") {
            conditions.push(eq(document.projectId, options.projectId));
        }

        const currentCondition = isAll
            ? sql`true`
            : sql`${document.createdAt} >= ${currentPeriodStart}`;

        const prevCondition = isAll
            ? sql`false`
            : sql`${document.createdAt} >= ${prevPeriodStart} AND ${document.createdAt} < ${currentPeriodStart}`;

        const [metrics] = await db
            .select({
                totalDocs: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${currentCondition}), 0)::int`,
                verifiedCount: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${currentCondition} AND ${document.status} = 'VERIFIED'), 0)::int`,
                rejectedCount: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${currentCondition} AND ${document.status} = 'REJECTED'), 0)::int`,
                transformedCount: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${currentCondition} AND ${document.status} = 'TRANSFORMED'), 0)::int`,
                uploadedCount: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${currentCondition} AND ${document.status} = 'UPLOADED'), 0)::int`,
                exportedCount: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${currentCondition} AND ${document.status} = 'EXPORTED'), 0)::int`,
                storageBytes: sql<number>`COALESCE(SUM(${document.sizeBytes}), 0)::bigint`,
                totalAllTime: sql<number>`COUNT(*)::int`,
                prevTotalDocs: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${prevCondition}), 0)::int`,
                prevVerifiedCount: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${prevCondition} AND ${document.status} = 'VERIFIED'), 0)::int`,
                prevRejectedCount: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${prevCondition} AND ${document.status} = 'REJECTED'), 0)::int`,
            })
            .from(document)
            .where(and(...conditions));

        const curTotal = metrics?.totalDocs ?? 0;
        const curVerified = metrics?.verifiedCount ?? 0;
        const curRejected = metrics?.rejectedCount ?? 0;

        // Calculate accuracy / success rate
        const totalEvaluated = curVerified + curRejected;
        const accuracyRate =
            totalEvaluated > 0
                ? Math.round((curVerified / totalEvaluated) * 1000) / 10
                : curTotal > 0
                ? 100
                : 0;

        const prevTotal = metrics?.prevTotalDocs ?? 0;
        const prevVerified = metrics?.prevVerifiedCount ?? 0;
        const prevRejected = metrics?.prevRejectedCount ?? 0;

        const prevEvaluated = prevVerified + prevRejected;
        const prevAccuracy =
            prevEvaluated > 0
                ? Math.round((prevVerified / prevEvaluated) * 1000) / 10
                : 0;

        // Calculate percentage trends
        const calcTrend = (cur: number, prev: number): number => {
            if (prev === 0) return cur > 0 ? 100 : 0;
            return Math.round(((cur - prev) / prev) * 1000) / 10;
        };

        const docTrend = isAll ? 0 : calcTrend(curTotal, prevTotal);
        const verifiedTrend = isAll ? 0 : calcTrend(curVerified, prevVerified);
        const accuracyTrend = isAll
            ? 0
            : Math.round((accuracyRate - prevAccuracy) * 10) / 10;

        const backlogCount = (metrics?.uploadedCount ?? 0) + (metrics?.transformedCount ?? 0);

        return {
            totalDocuments: curTotal,
            totalAllTime: metrics?.totalAllTime ?? 0,
            verifiedDocuments: curVerified,
            rejectedDocuments: curRejected,
            backlogCount,
            accuracyRate,
            storageBytes: Number(metrics?.storageBytes ?? 0),
            trends: {
                documentsDelta: docTrend,
                verifiedDelta: verifiedTrend,
                accuracyDelta: accuracyTrend,
            },
        };
    }

    /**
     * Calculates daily throughput time-series points with zero-filled continuous dates.
     */
    async getTimeSeriesThroughput(
        organizationId: string,
        options: AnalyticsQueryInput = {}
    ): Promise<TimeSeriesPoint[]> {
        const days = this.getPeriodDays(options.period);
        const effectiveDays = Math.min(days, 180);
        const startDate = new Date(Date.now() - effectiveDays * 24 * 60 * 60 * 1000);

        const conditions = [
            eq(document.organizationId, organizationId),
            eq(document.isDeleted, false),
            gte(document.createdAt, startDate),
        ];

        if (options.projectId && options.projectId !== "ALL") {
            conditions.push(eq(document.projectId, options.projectId));
        }

        const rawData = await db
            .select({
                date: sql<string>`to_char(${document.createdAt}, 'YYYY-MM-DD')`,
                uploaded: sql<number>`COUNT(*)::int`,
                verified: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${document.status} = 'VERIFIED'), 0)::int`,
                rejected: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${document.status} = 'REJECTED'), 0)::int`,
                transformed: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${document.status} IN ('TRANSFORMED', 'VERIFIED', 'EXPORTED')), 0)::int`,
            })
            .from(document)
            .where(and(...conditions))
            .groupBy(sql`to_char(${document.createdAt}, 'YYYY-MM-DD')`)
            .orderBy(sql`to_char(${document.createdAt}, 'YYYY-MM-DD')`);

        const dataByDate: Record<
            string,
            { uploaded: number; transformed: number; verified: number; rejected: number }
        > = {};

        for (const item of rawData) {
            dataByDate[item.date] = {
                uploaded: item.uploaded || 0,
                transformed: item.transformed || 0,
                verified: item.verified || 0,
                rejected: item.rejected || 0,
            };
        }

        const now = new Date();
        const points: TimeSeriesPoint[] = [];

        for (let i = effectiveDays - 1; i >= 0; i--) {
            const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = d.toISOString().split("T")[0];
            const existing = dataByDate[dateStr];
            points.push({
                date: dateStr,
                uploaded: existing ? existing.uploaded : 0,
                transformed: existing ? existing.transformed : 0,
                verified: existing ? existing.verified : 0,
                rejected: existing ? existing.rejected : 0,
            });
        }

        return points;
    }

    /**
     * Calculates document distribution across statuses with percentages.
     */
    async getStatusDistribution(
        organizationId: string,
        options: AnalyticsQueryInput = {}
    ): Promise<{ total: number; distribution: StatusDistributionItem[] }> {
        const conditions = [
            eq(document.organizationId, organizationId),
            eq(document.isDeleted, false),
        ];

        if (options.projectId && options.projectId !== "ALL") {
            conditions.push(eq(document.projectId, options.projectId));
        }

        const rawDistribution = await db
            .select({
                status: document.status,
                count: sql<number>`COUNT(*)::int`,
            })
            .from(document)
            .where(and(...conditions))
            .groupBy(document.status);

        const total = rawDistribution.reduce((sum, item) => sum + (item.count || 0), 0);

        const defaultStatuses = [
            "VERIFIED",
            "TRANSFORMED",
            "UPLOADED",
            "REJECTED",
            "EXPORTED",
        ];

        // Gather all distinct statuses returned or default
        const allStatusKeys = Array.from(
            new Set([...defaultStatuses, ...rawDistribution.map((d) => d.status)])
        );

        const distribution: StatusDistributionItem[] = allStatusKeys.map((status) => {
            const found = rawDistribution.find((d) => d.status === status);
            const count = found ? found.count : 0;
            const percentage = total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
            return {
                status,
                count,
                percentage,
            };
        });

        return {
            total,
            distribution,
        };
    }

    /**
     * Calculates throughput and accuracy performance broken down by project.
     */
    async getProjectPerformance(organizationId: string): Promise<ProjectPerformanceItem[]> {
        const projects = await db
            .select({
                id: project.id,
                name: project.name,
                description: project.description,
                createdAt: project.createdAt,
                updatedAt: project.updatedAt,
                templateDocumentId: project.templateDocumentId,
                templateName: template.originalFileName,
            })
            .from(project)
            .leftJoin(template, eq(project.templateDocumentId, template.id))
            .where(and(eq(project.organizationId, organizationId), eq(project.isDeleted, false)));

        if (!projects.length) return [];

        const projectIds = projects.map((p) => p.id);

        const docMetrics = await db
            .select({
                projectId: document.projectId,
                totalDocs: sql<number>`COUNT(*)::int`,
                verifiedCount: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${document.status} = 'VERIFIED'), 0)::int`,
                rejectedCount: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${document.status} = 'REJECTED'), 0)::int`,
                backlogCount: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${document.status} IN ('UPLOADED', 'TRANSFORMED')), 0)::int`,
                totalBytes: sql<number>`COALESCE(SUM(${document.sizeBytes}), 0)::bigint`,
                lastActivityDate: sql<Date | null>`MAX(${document.updatedAt})`,
            })
            .from(document)
            .where(
                and(
                    eq(document.organizationId, organizationId),
                    eq(document.isDeleted, false),
                    inArray(document.projectId, projectIds)
                )
            )
            .groupBy(document.projectId);

        const metricsMap = new Map<string, (typeof docMetrics)[number]>();
        for (const metric of docMetrics) {
            metricsMap.set(metric.projectId, metric);
        }

        return projects.map((proj) => {
            const metric = metricsMap.get(proj.id);
            const totalDocs = metric?.totalDocs || 0;
            const verifiedCount = metric?.verifiedCount || 0;
            const rejectedCount = metric?.rejectedCount || 0;
            const backlogCount = metric?.backlogCount || 0;
            const storageBytes = Number(metric?.totalBytes || 0);

            const evaluated = verifiedCount + rejectedCount;
            const successRate =
                evaluated > 0
                    ? Math.round((verifiedCount / evaluated) * 100)
                    : totalDocs > 0
                    ? 100
                    : 0;

            const rawDate = metric?.lastActivityDate || proj.updatedAt || proj.createdAt;
            let lastActivity = new Date().toISOString();
            if (rawDate instanceof Date) {
                lastActivity = rawDate.toISOString();
            } else if (rawDate) {
                lastActivity = new Date(rawDate).toISOString();
            }

            return {
                id: proj.id,
                name: proj.name,
                description: proj.description || "",
                templateName: proj.templateName || null,
                totalDocuments: totalDocs,
                verifiedCount,
                rejectedCount,
                backlogCount,
                successRate,
                storageBytes,
                lastActivity,
            };
        });
    }

    /**
     * Calculates reviewer efficiency leaderboard with role-based data privacy.
     */
    async getReviewerEfficiency(
        organizationId: string,
        days = 30,
        userRole?: string
    ): Promise<ReviewerStatItem[]> {
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const isPrivileged = userRole
            ? ["OWNER", "ADMIN"].includes(userRole.toUpperCase())
            : false;

        const reviewerStats = await db
            .select({
                actorId: auditLog.actorId,
                totalAudited: sql<number>`COUNT(*)::int`,
                approvedCount: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${auditLog.action} = 'DOCUMENT_VERIFIED'), 0)::int`,
                rejectedCount: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${auditLog.action} = 'DOCUMENT_REJECTED'), 0)::int`,
                lastActive: sql<Date | string | null>`MAX(${auditLog.createdAt})`,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                avatar: user.image,
            })
            .from(auditLog)
            .leftJoin(user, eq(auditLog.actorId, user.id))
            .where(
                and(
                    eq(auditLog.organizationId, organizationId),
                    inArray(auditLog.action, ["DOCUMENT_VERIFIED", "DOCUMENT_REJECTED"]),
                    gte(auditLog.createdAt, startDate),
                    isNotNull(auditLog.actorId)
                )
            )
            .groupBy(
                auditLog.actorId,
                user.id,
                user.firstName,
                user.lastName,
                user.email,
                user.image
            )
            .orderBy(desc(sql`COUNT(*)`))
            .limit(10);

        return reviewerStats.map((r) => {
            const totalAudited = r.totalAudited || 0;
            const approvedCount = r.approvedCount || 0;
            const rejectedCount = r.rejectedCount || 0;

            const approvalRate =
                totalAudited > 0 ? Math.round((approvedCount / totalAudited) * 100) : 100;

            const name =
                `${r.firstName || ""} ${r.lastName || ""}`.trim() ||
                r.email ||
                "Workspace Reviewer";

            if (!isPrivileged) {
                return {
                    userId: r.actorId || "system",
                    name,
                    totalAudited,
                    approvalRate,
                };
            }

            let lastActive: string | undefined = undefined;
            if (r.lastActive instanceof Date) {
                lastActive = r.lastActive.toISOString();
            } else if (r.lastActive) {
                lastActive = new Date(r.lastActive).toISOString();
            }

            return {
                userId: r.actorId || "system",
                name,
                email: r.email || "",
                avatar: r.avatar || null,
                totalAudited,
                approvedCount,
                rejectedCount,
                approvalRate,
                lastActive,
            };
        });
    }

    /**
     * Calculates MIME type distribution of stored documents.
     */
    async getFileTypeDistribution(
        organizationId: string,
        options: AnalyticsQueryInput = {}
    ): Promise<FileTypeItem[]> {
        const conditions = [
            eq(document.organizationId, organizationId),
            eq(document.isDeleted, false),
        ];

        if (options.projectId && options.projectId !== "ALL") {
            conditions.push(eq(document.projectId, options.projectId));
        }

        const raw = await db
            .select({
                mimeType: document.mimeType,
                count: sql<number>`COUNT(*)::int`,
                totalBytes: sql<number>`COALESCE(SUM(${document.sizeBytes}), 0)::bigint`,
            })
            .from(document)
            .where(and(...conditions))
            .groupBy(document.mimeType)
            .orderBy(desc(sql`COUNT(*)`));

        const total = raw.reduce((sum, item) => sum + (item.count || 0), 0);

        return raw.map((item) => {
            const mime = item.mimeType || "unknown";
            let label = "PDF Documents";
            if (mime.includes("image")) label = "Scans & Images";
            else if (mime.includes("word") || mime.includes("officedocument"))
                label = "Word Docs";
            else if (mime.includes("text") || mime.includes("plain")) label = "Plain Text";

            const percentage = total > 0 ? Math.round((item.count / total) * 1000) / 10 : 0;

            return {
                mimeType: mime,
                label,
                count: item.count,
                totalBytes: Number(item.totalBytes),
                percentage,
            };
        });
    }

    /**
     * Bundles all analytical sub-queries for efficient, single-roundtrip dashboard presentation.
     */
    async getDashboardAnalytics(
        organizationId: string,
        options: AnalyticsQueryInput = {},
        userRole?: string
    ): Promise<DashboardAnalyticsData> {
        const [overview, timeSeries, statusDist, projects, reviewers, fileTypes] =
            await Promise.all([
                this.getOverviewMetrics(organizationId, options),
                this.getTimeSeriesThroughput(organizationId, options),
                this.getStatusDistribution(organizationId, options),
                this.getProjectPerformance(organizationId),
                this.getReviewerEfficiency(
                    organizationId,
                    options.period === "7d" ? 7 : 30,
                    userRole
                ),
                this.getFileTypeDistribution(organizationId, options),
            ]);

        return {
            overview,
            timeSeries,
            statusDistribution: statusDist.distribution,
            totalStatusCount: statusDist.total,
            projects,
            reviewers,
            fileTypes,
        };
    }
}

export const analyticsService = new AnalyticsService();
