import { baseApi } from "@/services/baseApi";

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

export interface AnalyticsQueryParams {
    period?: "7d" | "30d" | "90d" | "all";
    projectId?: string;
}

export const analyticsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getDashboardAnalytics: builder.query<
            { success: boolean; data: DashboardAnalyticsData },
            AnalyticsQueryParams | void
        >({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params?.period) searchParams.set("period", params.period);
                if (params?.projectId && params.projectId !== "ALL") {
                    searchParams.set("projectId", params.projectId);
                }

                const queryString = searchParams.toString();
                return {
                    url: queryString ? `/analytics/dashboard?${queryString}` : "/analytics/dashboard",
                    method: "GET",
                };
            },
            providesTags: ["Analytics"],
        }),

        getThroughputData: builder.query<
            { success: boolean; data: TimeSeriesPoint[] },
            AnalyticsQueryParams | void
        >({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params?.period) searchParams.set("period", params.period);
                if (params?.projectId && params.projectId !== "ALL") {
                    searchParams.set("projectId", params.projectId);
                }

                const queryString = searchParams.toString();
                return {
                    url: queryString ? `/analytics/throughput?${queryString}` : "/analytics/throughput",
                    method: "GET",
                };
            },
            providesTags: ["Analytics"],
        }),
    }),
});

export const { useGetDashboardAnalyticsQuery, useGetThroughputDataQuery } = analyticsApi;
