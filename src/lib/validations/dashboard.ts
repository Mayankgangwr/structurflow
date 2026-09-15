import { z } from "zod";

export const dashboardQuerySchema = z.object({
    period: z.enum(["7d", "30d", "90d", "all"]).optional().default("7d"),
    projectId: z.string().optional(),
    recentLimit: z.coerce.number().min(1).max(50).optional().default(6),
    activityLimit: z.coerce.number().min(1).max(20).optional().default(5),
});

export interface DashboardQueryInput {
    period?: "7d" | "30d" | "90d" | "all";
    projectId?: string;
    recentLimit?: number;
    activityLimit?: number;
}

export interface DashboardOverview {
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

export interface DashboardPipelineCounts {
    uploaded: number;
    processing: number;
    needsVerification: number;
    verified: number;
    exported: number;
}

export interface DashboardRecentDocument {
    id: string;
    _id: string;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
    secureUrl: string;
    status: string;
    processingDetails?: any;
    createdAt: string;
    updatedAt?: string;
    projectId?: {
        _id: string;
        id: string;
        name: string;
    } | string | null;
}

export interface DashboardActivityItem {
    id: string;
    action: string;
    organizationId: string;
    actorId: string | null;
    actorName: string;
    actorEmail?: string;
    projectId?: string | null;
    projectName?: string | null;
    documentId?: string | null;
    documentFilename?: string | null;
    details: Record<string, any>;
    createdAt: string;
}

export interface DashboardStatusDistributionItem {
    status: string;
    count: number;
    percentage: number;
}

export interface DashboardDataResponse {
    overview: DashboardOverview;
    pipelineCounts: DashboardPipelineCounts;
    recentDocuments: DashboardRecentDocument[];
    topPendingDocument: DashboardRecentDocument | null;
    totalProjects: number;
    recentActivities: DashboardActivityItem[];
    statusDistribution: DashboardStatusDistributionItem[];
}
