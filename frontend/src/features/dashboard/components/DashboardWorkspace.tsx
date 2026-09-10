"use client";

import React, { useMemo } from "react";
import DashboardWelcomeHeader from "./DashboardWelcomeHeader";
import DashboardKPIs from "./DashboardKPIs";
import { DashboardPipelineFlow, PipelineCounts } from "./DashboardPipelineFlow";
import { DashboardAttentionCard } from "./DashboardAttentionCard";
import { DashboardRecentDocumentsTable } from "./DashboardRecentDocumentsTable";
import { DashboardActivityFeed } from "./DashboardActivityFeed";
import { useGetDashboardAnalyticsQuery } from "@/features/analytics/analyticsApi";
import { useGetAllDocumentsQuery } from "@/features/documents/documentApi";
import { useGetProjectsQuery } from "@/features/projects/projectApi";
import { useGetActivitiesQuery } from "@/features/activity/activityApi";
import { usePermissions } from "@/features/auth/hooks/usePermissions";

export const DashboardWorkspace: React.FC = () => {
    const { user } = usePermissions();

    // 1. Fetch live analytics (KPIs, status distribution, accuracy)
    const {
        data: analyticsResponse,
        isLoading: isAnalyticsLoading,
        isFetching: isAnalyticsFetching,
        refetch: refetchAnalytics,
    } = useGetDashboardAnalyticsQuery({ period: "7d" });

    // 2. Fetch live recent documents (table + top pending review item)
    const {
        data: documentsResponse,
        isLoading: isDocsLoading,
        refetch: refetchDocs,
    } = useGetAllDocumentsQuery({
        limit: 6,
        sortBy: "createdAt",
        sortOrder: "desc",
    });

    // 3. Fetch active projects count
    const {
        data: projectsResponse,
        isLoading: isProjectsLoading,
    } = useGetProjectsQuery({ limit: 1 });

    // 4. Fetch live recent audit activity feed
    const {
        data: activityResponse,
        isLoading: isActivityLoading,
        refetch: refetchActivity,
    } = useGetActivitiesQuery({ limit: 5 });

    const analytics = analyticsResponse?.data;
    const overview = analytics?.overview;
    const documentsData = documentsResponse?.data;
    const recentDocuments = documentsData?.documents || [];
    const activities = activityResponse?.data?.activities || [];

    // Calculate dynamic pipeline counts
    // Calculate live pipeline stage counts directly from database aggregate stats
    const pipelineCounts: PipelineCounts = useMemo(() => {
        const docStats = documentsData?.stats;

        // Primary source of truth: MongoDB aggregate stats from document repository
        if (docStats) {
            return {
                uploaded: docStats.uploaded ?? 0,
                processing: docStats.processing ?? 0,
                needsVerification: docStats.needsVerification ?? 0,
                verified: docStats.verified ?? 0,
                exported: docStats.exported ?? 0,
            };
        }

        // Fallback: analytics status distribution if document stats are still loading
        const statusMap: Record<string, number> = {};
        analytics?.statusDistribution?.forEach((item) => {
            statusMap[item.status] = item.count;
        });

        return {
            uploaded: statusMap["UPLOADED"] ?? 0,
            processing: (statusMap["PROCESSING"] ?? 0) + (statusMap["TRANSFORMED"] ?? 0),
            needsVerification: overview?.backlogCount ?? statusMap["REVIEW_REQUIRED"] ?? 0,
            verified: overview?.verifiedDocuments ?? statusMap["VERIFIED"] ?? 0,
            exported: statusMap["EXPORTED"] ?? 0,
        };
    }, [documentsData?.stats, analytics?.statusDistribution, overview]);

    // Determine top document pending verification
    const topPendingDoc = useMemo(() => {
        return (
            recentDocuments.find(
                (d) => d.status === "TRANSFORMED" || d.status === "REVIEW_REQUIRED"
            ) || null
        );
    }, [recentDocuments]);

    const totalProjects =
        projectsResponse?.data?.pagination?.total ??
        projectsResponse?.data?.meta?.totalProjects ??
        analytics?.projects?.length ??
        0;

    const orgName = (user as any)?.organization?.name;

    return (
        <div className="p-3 sm:p-5 lg:p-6 flex-1 flex flex-col gap-4 sm:gap-5 max-w-7xl mx-auto w-full">
            {/* 1. Welcome Header */}
            <DashboardWelcomeHeader
                pendingVerificationCount={overview?.backlogCount ?? pipelineCounts.needsVerification}
                organizationName={orgName}
            />

            {/* 2. Operational KPIs */}
            <DashboardKPIs
                totalDocuments={overview?.totalDocuments ?? overview?.totalAllTime ?? recentDocuments.length}
                backlogCount={overview?.backlogCount ?? pipelineCounts.needsVerification}
                verifiedCount={overview?.verifiedDocuments ?? pipelineCounts.verified}
                accuracyRate={overview?.accuracyRate ?? 100}
                totalProjects={totalProjects}
                documentsTrend={overview?.trends?.documentsDelta ?? 0}
                isLoading={isAnalyticsLoading}
            />

            {/* 3. Visual Pipeline Flow */}
            <DashboardPipelineFlow
                counts={pipelineCounts}
                isLoading={isAnalyticsLoading || isDocsLoading}
            />

            {/* 4. Two-Column Dashboard Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
                {/* Left (8 Cols): Recent Ingested Documents */}
                <div className="lg:col-span-8 flex flex-col">
                    <DashboardRecentDocumentsTable
                        documents={recentDocuments}
                        isLoading={isDocsLoading}
                    />
                </div>

                {/* Right (4 Cols): Attention Card + Live Activity */}
                <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-5">
                    {/* Priority Attention Card */}
                    <DashboardAttentionCard
                        pendingDocument={topPendingDoc}
                        pendingCount={overview?.backlogCount ?? pipelineCounts.needsVerification}
                        isLoading={isDocsLoading || isAnalyticsLoading}
                    />

                    {/* Live Audit Activity Feed */}
                    <DashboardActivityFeed
                        activities={activities}
                        isLoading={isActivityLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default DashboardWorkspace;
