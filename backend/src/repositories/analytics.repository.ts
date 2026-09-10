import mongoose from "mongoose";
import { DocumentModel, DocumentStatus } from "@/models/document.model";
import { ProjectModel } from "@/models/project.model";
import { AuditLogModel, AuditAction } from "@/models/audit-log.model";

export interface AnalyticsQueryOptions {
    projectId?: string;
    period?: "7d" | "30d" | "90d" | "all";
}

class AnalyticsRepository {
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

    async getOverviewMetrics(organizationId: string, options: AnalyticsQueryOptions = {}) {
        const orgObjectId = new mongoose.Types.ObjectId(organizationId);
        const days = this.getPeriodDays(options.period);

        const now = new Date();
        const currentPeriodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        const prevPeriodStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);

        const baseMatch: Record<string, any> = {
            organizationId: orgObjectId,
            isDeleted: { $ne: true },
        };

        if (options.projectId && mongoose.Types.ObjectId.isValid(options.projectId)) {
            baseMatch.projectId = new mongoose.Types.ObjectId(options.projectId);
        }

        // Current period match
        const currentMatch = options.period === "all"
            ? { ...baseMatch }
            : { ...baseMatch, createdAt: { $gte: currentPeriodStart } };

        // Previous period match for trend comparison
        const prevMatch = options.period === "all"
            ? null
            : { ...baseMatch, createdAt: { $gte: prevPeriodStart, $lt: currentPeriodStart } };

        const [currentStats, prevStats, totalAllTimeDocs, totalStorage] = await Promise.all([
            // Aggregation for current period
            DocumentModel.aggregate([
                { $match: currentMatch },
                {
                    $group: {
                        _id: null,
                        totalDocs: { $sum: 1 },
                        verifiedCount: {
                            $sum: { $cond: [{ $eq: ["$status", DocumentStatus.VERIFIED] }, 1, 0] },
                        },
                        rejectedCount: {
                            $sum: { $cond: [{ $eq: ["$status", DocumentStatus.REJECTED] }, 1, 0] },
                        },
                        transformedCount: {
                            $sum: { $cond: [{ $eq: ["$status", DocumentStatus.TRANSFORMED] }, 1, 0] },
                        },
                        uploadedCount: {
                            $sum: { $cond: [{ $eq: ["$status", DocumentStatus.UPLOADED] }, 1, 0] },
                        },
                        exportedCount: {
                            $sum: { $cond: [{ $eq: ["$status", DocumentStatus.EXPORTED] }, 1, 0] },
                        },
                        storageBytes: { $sum: "$sizeBytes" },
                    },
                },
            ]),

            // Aggregation for previous period (for trend calculation)
            prevMatch
                ? DocumentModel.aggregate([
                    { $match: prevMatch },
                    {
                        $group: {
                            _id: null,
                            totalDocs: { $sum: 1 },
                            verifiedCount: {
                                $sum: { $cond: [{ $eq: ["$status", DocumentStatus.VERIFIED] }, 1, 0] },
                            },
                            rejectedCount: {
                                $sum: { $cond: [{ $eq: ["$status", DocumentStatus.REJECTED] }, 1, 0] },
                            },
                        },
                    },
                ])
                : Promise.resolve([]),

            // Total documents all-time in workspace
            DocumentModel.countDocuments(baseMatch),

            // Total storage all-time
            DocumentModel.aggregate([
                { $match: baseMatch },
                { $group: { _id: null, totalBytes: { $sum: "$sizeBytes" } } },
            ]),
        ]);

        const cur = currentStats[0] || {
            totalDocs: 0,
            verifiedCount: 0,
            rejectedCount: 0,
            transformedCount: 0,
            uploadedCount: 0,
            exportedCount: 0,
            storageBytes: 0,
        };

        const prev = prevStats[0] || {
            totalDocs: 0,
            verifiedCount: 0,
            rejectedCount: 0,
        };

        // Calculate accuracy / success rate
        const totalEvaluated = cur.verifiedCount + cur.rejectedCount;
        const accuracyRate = totalEvaluated > 0
            ? Math.round((cur.verifiedCount / totalEvaluated) * 1000) / 10
            : cur.totalDocs > 0 ? 100 : 0;

        const prevEvaluated = prev.verifiedCount + prev.rejectedCount;
        const prevAccuracy = prevEvaluated > 0
            ? Math.round((prev.verifiedCount / prevEvaluated) * 1000) / 10
            : 0;

        // Calculate trends (% deltas)
        const calcTrend = (currentVal: number, prevVal: number): number => {
            if (prevVal === 0) return currentVal > 0 ? 100 : 0;
            return Math.round(((currentVal - prevVal) / prevVal) * 1000) / 10;
        };

        const docTrend = calcTrend(cur.totalDocs, prev.totalDocs);
        const verifiedTrend = calcTrend(cur.verifiedCount, prev.verifiedCount);
        const accuracyTrend = Math.round((accuracyRate - prevAccuracy) * 10) / 10;

        const backlogCount = cur.uploadedCount + cur.transformedCount;
        const totalStorageBytes = totalStorage[0]?.totalBytes || 0;

        return {
            totalDocuments: cur.totalDocs,
            totalAllTime: totalAllTimeDocs,
            verifiedDocuments: cur.verifiedCount,
            rejectedDocuments: cur.rejectedCount,
            backlogCount,
            accuracyRate,
            storageBytes: totalStorageBytes,
            trends: {
                documentsDelta: docTrend,
                verifiedDelta: verifiedTrend,
                accuracyDelta: accuracyTrend,
            },
        };
    }

    async getTimeSeriesThroughput(organizationId: string, options: AnalyticsQueryOptions = {}) {
        const orgObjectId = new mongoose.Types.ObjectId(organizationId);
        const days = this.getPeriodDays(options.period);

        const now = new Date();
        const startDate = options.period === "all"
            ? new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000) // Last 180 days for 'all'
            : new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const match: Record<string, any> = {
            organizationId: orgObjectId,
            isDeleted: { $ne: true },
            createdAt: { $gte: startDate },
        };

        if (options.projectId && mongoose.Types.ObjectId.isValid(options.projectId)) {
            match.projectId = new mongoose.Types.ObjectId(options.projectId);
        }

        const rawData = await DocumentModel.aggregate([
            { $match: match },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    uploaded: { $sum: 1 },
                    verified: {
                        $sum: { $cond: [{ $eq: ["$status", DocumentStatus.VERIFIED] }, 1, 0] },
                    },
                    rejected: {
                        $sum: { $cond: [{ $eq: ["$status", DocumentStatus.REJECTED] }, 1, 0] },
                    },
                    transformed: {
                        $sum: {
                            $cond: [
                                {
                                    $in: [
                                        "$status",
                                        [DocumentStatus.TRANSFORMED, DocumentStatus.VERIFIED, DocumentStatus.EXPORTED],
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Map into date-keyed lookup
        const dataByDate: Record<string, { uploaded: number; transformed: number; verified: number; rejected: number }> = {};
        for (const item of rawData) {
            dataByDate[item._id] = {
                uploaded: item.uploaded || 0,
                transformed: item.transformed || 0,
                verified: item.verified || 0,
                rejected: item.rejected || 0,
            };
        }

        // Fill zero-count days so the time-series is continuous
        const points: { date: string; uploaded: number; transformed: number; verified: number; rejected: number }[] = [];
        const effectiveDays = Math.min(days, 180);
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

    async getStatusDistribution(organizationId: string, options: AnalyticsQueryOptions = {}) {
        const orgObjectId = new mongoose.Types.ObjectId(organizationId);

        const match: Record<string, any> = {
            organizationId: orgObjectId,
            isDeleted: { $ne: true },
        };

        if (options.projectId && mongoose.Types.ObjectId.isValid(options.projectId)) {
            match.projectId = new mongoose.Types.ObjectId(options.projectId);
        }

        const rawDistribution = await DocumentModel.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                },
            },
        ]);

        const total = rawDistribution.reduce((sum, item) => sum + item.count, 0);

        const statuses = [
            DocumentStatus.VERIFIED,
            DocumentStatus.TRANSFORMED,
            DocumentStatus.UPLOADED,
            DocumentStatus.REJECTED,
            DocumentStatus.EXPORTED,
        ];

        const distribution = statuses.map((status) => {
            const found = rawDistribution.find((d) => d._id === status);
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

    async getProjectPerformance(organizationId: string) {
        const orgObjectId = new mongoose.Types.ObjectId(organizationId);

        // Fetch all non-deleted projects for this org
        const projects = await ProjectModel.find({
            organizationId: orgObjectId,
            isDeleted: { $ne: true },
        })
            .select("_id name description templateDocumentId createdAt updatedAt")
            .populate("templateDocumentId", "originalFileName")
            .lean();

        if (!projects.length) return [];

        const projectIds = projects.map((p) => p._id);

        // Aggregate document metrics by project
        const docMetrics = await DocumentModel.aggregate([
            {
                $match: {
                    organizationId: orgObjectId,
                    projectId: { $in: projectIds },
                    isDeleted: { $ne: true },
                },
            },
            {
                $group: {
                    _id: "$projectId",
                    totalDocs: { $sum: 1 },
                    verifiedCount: {
                        $sum: { $cond: [{ $eq: ["$status", DocumentStatus.VERIFIED] }, 1, 0] },
                    },
                    rejectedCount: {
                        $sum: { $cond: [{ $eq: ["$status", DocumentStatus.REJECTED] }, 1, 0] },
                    },
                    backlogCount: {
                        $sum: {
                            $cond: [
                                {
                                    $in: [
                                        "$status",
                                        [DocumentStatus.UPLOADED, DocumentStatus.TRANSFORMED],
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                    totalBytes: { $sum: "$sizeBytes" },
                    lastActivityDate: { $max: "$updatedAt" },
                },
            },
        ]);

        const metricsMap = new Map<string, any>();
        for (const metric of docMetrics) {
            metricsMap.set(metric._id.toString(), metric);
        }

        return projects.map((proj: any) => {
            const metric = metricsMap.get(proj._id.toString()) || {
                totalDocs: 0,
                verifiedCount: 0,
                rejectedCount: 0,
                backlogCount: 0,
                totalBytes: 0,
                lastActivityDate: proj.updatedAt || proj.createdAt,
            };

            const evaluated = metric.verifiedCount + metric.rejectedCount;
            const successRate = evaluated > 0
                ? Math.round((metric.verifiedCount / evaluated) * 100)
                : metric.totalDocs > 0 ? 100 : 0;

            return {
                id: proj._id.toString(),
                name: proj.name,
                description: proj.description || "",
                templateName: proj.templateDocumentId?.originalFileName || null,
                totalDocuments: metric.totalDocs,
                verifiedCount: metric.verifiedCount,
                rejectedCount: metric.rejectedCount,
                backlogCount: metric.backlogCount,
                successRate,
                storageBytes: metric.totalBytes,
                lastActivity: metric.lastActivityDate,
            };
        });
    }

    async getReviewerEfficiency(organizationId: string, days = 30) {
        const orgObjectId = new mongoose.Types.ObjectId(organizationId);
        const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const reviewerStats = await AuditLogModel.aggregate([
            {
                $match: {
                    organizationId: orgObjectId,
                    action: { $in: [AuditAction.DOCUMENT_VERIFIED, AuditAction.DOCUMENT_REJECTED] },
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: "$actorId",
                    totalAudited: { $sum: 1 },
                    approvedCount: {
                        $sum: { $cond: [{ $eq: ["$action", AuditAction.DOCUMENT_VERIFIED] }, 1, 0] },
                    },
                    rejectedCount: {
                        $sum: { $cond: [{ $eq: ["$action", AuditAction.DOCUMENT_REJECTED] }, 1, 0] },
                    },
                    lastActive: { $max: "$createdAt" },
                },
            },
            { $sort: { totalAudited: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",
                },
            },
            { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: 1,
                    totalAudited: 1,
                    approvedCount: 1,
                    rejectedCount: 1,
                    lastActive: 1,
                    firstName: "$user.firstName",
                    lastName: "$user.lastName",
                    email: "$user.email",
                    avatar: "$user.avatar",
                },
            },
        ]);

        return reviewerStats.map((r) => {
            const approvalRate = r.totalAudited > 0
                ? Math.round((r.approvedCount / r.totalAudited) * 100)
                : 100;

            const name = `${r.firstName || ""} ${r.lastName || ""}`.trim() || r.email || "Reviewer";

            return {
                userId: r._id ? r._id.toString() : "system",
                name,
                email: r.email || "",
                avatar: r.avatar || null,
                totalAudited: r.totalAudited,
                approvedCount: r.approvedCount,
                rejectedCount: r.rejectedCount,
                approvalRate,
                lastActive: r.lastActive,
            };
        });
    }

    async getFileTypeDistribution(organizationId: string, options: AnalyticsQueryOptions = {}) {
        const orgObjectId = new mongoose.Types.ObjectId(organizationId);
        const match: Record<string, any> = {
            organizationId: orgObjectId,
            isDeleted: { $ne: true },
        };

        if (options.projectId && mongoose.Types.ObjectId.isValid(options.projectId)) {
            match.projectId = new mongoose.Types.ObjectId(options.projectId);
        }

        const raw = await DocumentModel.aggregate([
            { $match: match },
            {
                $group: {
                    _id: "$mimeType",
                    count: { $sum: 1 },
                    totalBytes: { $sum: "$sizeBytes" },
                },
            },
            { $sort: { count: -1 } },
        ]);

        const total = raw.reduce((sum, item) => sum + item.count, 0);

        return raw.map((item) => {
            let label = "PDF Documents";
            if (item._id?.includes("image")) label = "Scans & Images";
            else if (item._id?.includes("word") || item._id?.includes("officedocument")) label = "Word Docs";
            else if (item._id?.includes("text") || item._id?.includes("plain")) label = "Plain Text";

            const percentage = total > 0 ? Math.round((item.count / total) * 1000) / 10 : 0;

            return {
                mimeType: item._id || "unknown",
                label,
                count: item.count,
                totalBytes: item.totalBytes,
                percentage,
            };
        });
    }
}

const analyticsRepository = new AnalyticsRepository();
export default analyticsRepository;
