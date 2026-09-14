import { baseApi } from "@/services/baseApi";

export enum AuditAction {
    USER_REGISTERED = "USER_REGISTERED",
    USER_LOGGED_IN = "USER_LOGGED_IN",
    USER_LOGGED_OUT = "USER_LOGGED_OUT",
    DOCUMENT_UPLOADED = "DOCUMENT_UPLOADED",
    DOCUMENT_TRANSFORMED = "DOCUMENT_TRANSFORMED",
    DOCUMENT_VERIFIED = "DOCUMENT_VERIFIED",
    DOCUMENT_REJECTED = "DOCUMENT_REJECTED",
    DOCUMENT_DELETED = "DOCUMENT_DELETED",
    DOCUMENT_STATUS_CHANGED = "DOCUMENT_STATUS_CHANGED",
    EXTRACTION_APPROVED = "EXTRACTION_APPROVED",
    EXTRACTION_REJECTED = "EXTRACTION_REJECTED",
    TEMPLATE_UPLOADED = "TEMPLATE_UPLOADED",
    TEMPLATE_PROCESSED = "TEMPLATE_PROCESSED",
    PROJECT_CREATED = "PROJECT_CREATED",
    PROJECT_UPDATED = "PROJECT_UPDATED",
    PROJECT_DELETED = "PROJECT_DELETED",
    MEMBER_INVITED = "MEMBER_INVITED",
    MEMBER_ROLE_UPDATED = "MEMBER_ROLE_UPDATED",
    MEMBER_REMOVED = "MEMBER_REMOVED",
    INVITE_REVOKED = "INVITE_REVOKED",
    INVITE_ACCEPTED = "INVITE_ACCEPTED",
}

export type ActivityCategory = "ALL" | "DOCUMENTS" | "VERIFICATION" | "TEAM" | "PROJECTS";

export interface ActivityActor {
    _id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    avatar?: string | null;
}

export interface ActivityDocument {
    _id: string;
    originalFileName?: string;
    status?: string;
    sizeBytes?: number;
}

export interface ActivityProject {
    _id: string;
    name?: string;
}

export interface ActivityItem {
    _id: string;
    organizationId: string;
    actorId?: ActivityActor | null;
    documentId?: ActivityDocument | null;
    projectId?: ActivityProject | null;
    action: AuditAction | string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ActivityStats {
    total24h: number;
    verifications24h: number;
    uploads24h: number;
    teamUpdates24h: number;
    totalAllTime: number;
}

export interface ActivityPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ActivityQueryParams {
    page?: number;
    limit?: number;
    category?: ActivityCategory;
    action?: string;
    actorId?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
}

export interface ActivityResponseData {
    activities: ActivityItem[];
    pagination: ActivityPagination;
}

export const activityApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getActivities: builder.query<
            { success: boolean; data: ActivityResponseData },
            ActivityQueryParams | void
        >({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params?.page) searchParams.set("page", String(params.page));
                if (params?.limit) searchParams.set("limit", String(params.limit));
                if (params?.category && params.category !== "ALL") {
                    searchParams.set("category", params.category);
                }
                if (params?.action && params.action !== "ALL") {
                    searchParams.set("action", params.action);
                }
                if (params?.actorId) searchParams.set("actorId", params.actorId);
                if (params?.search && params.search.trim()) {
                    searchParams.set("search", params.search.trim());
                }
                if (params?.startDate) searchParams.set("startDate", params.startDate);
                if (params?.endDate) searchParams.set("endDate", params.endDate);

                const queryString = searchParams.toString();
                return {
                    url: queryString ? `/activity?${queryString}` : "/activity",
                    method: "GET",
                };
            },
            providesTags: ["Activities"],
        }),

        getActivityStats: builder.query<{ success: boolean; data: ActivityStats }, void>({
            query: () => ({
                url: "/activity/stats",
                method: "GET",
            }),
            providesTags: ["Activities"],
        }),
    }),
});

export const { useGetActivitiesQuery, useGetActivityStatsQuery } = activityApi;
