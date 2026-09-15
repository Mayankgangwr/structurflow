"use client";

import React, { useMemo } from "react";
import DashboardWelcomeHeader from "./DashboardWelcomeHeader";
import DashboardKPIs from "./DashboardKPIs";
import { DashboardPipelineFlow, PipelineCounts } from "./DashboardPipelineFlow";
import { DashboardAttentionCard } from "./DashboardAttentionCard";
import { DashboardRecentDocumentsTable } from "./DashboardRecentDocumentsTable";
import { DashboardActivityFeed } from "./DashboardActivityFeed";
import { useGetDashboardQuery } from "@/features/dashboard/dashboardApi";
import { usePermissions } from "@/features/auth/hooks/usePermissions";

export const DashboardWorkspace: React.FC = () => {
    const { user } = usePermissions();

    // 1. Fetch live unified mission control dashboard data (consolidated single serverless request)
    const {
        data: dashboardResponse,
        isLoading: isDashboardLoading,
        isFetching: isDashboardFetching,
        refetch: refetchDashboard,
    } = useGetDashboardQuery({ period: "7d" });

    const dashboard = dashboardResponse?.data;
    const overview = dashboard?.overview;
    const recentDocuments = (dashboard?.recentDocuments || []) as any[];
    const topPendingDoc = (dashboard?.topPendingDocument || null) as any;
    const activities = (dashboard?.recentActivities || []) as any[];
    const totalProjects = dashboard?.totalProjects ?? 0;

    // Direct pipeline counts from database aggregate
    const pipelineCounts: PipelineCounts = useMemo(() => {
        if (dashboard?.pipelineCounts) {
            return dashboard.pipelineCounts;
        }
        return {
            uploaded: 0,
            processing: 0,
            needsVerification: 0,
            verified: 0,
            exported: 0,
        };
    }, [dashboard?.pipelineCounts]);

    const orgName = (user as any)?.organization?.name;
    const isRefreshing = isDashboardFetching;

    const handleRefresh = () => {
        refetchDashboard();
    };

    const pendingCount = pipelineCounts.needsVerification ?? overview?.backlogCount ?? 0;

    return (
        <div className="p-3 sm:p-5 lg:p-6 flex-1 flex flex-col gap-4 sm:gap-5 max-w-7xl mx-auto w-full">
            {/* 1. Welcome Header */}
            <DashboardWelcomeHeader
                pendingVerificationCount={pendingCount}
                organizationName={orgName}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
            />

            {/* 2. Operational KPIs */}
            <DashboardKPIs
                totalDocuments={overview?.totalDocuments ?? overview?.totalAllTime ?? recentDocuments.length}
                backlogCount={pendingCount}
                verifiedCount={overview?.verifiedDocuments ?? pipelineCounts.verified}
                accuracyRate={overview?.accuracyRate ?? 100}
                totalProjects={totalProjects}
                documentsTrend={overview?.trends?.documentsDelta ?? 0}
                isLoading={isDashboardLoading}
            />

            {/* 3. Visual Pipeline Flow */}
            <DashboardPipelineFlow
                counts={pipelineCounts}
                isLoading={isDashboardLoading}
            />

            {/* 4. Two-Column Dashboard Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
                {/* Left (8 Cols): Recent Ingested Documents */}
                <div className="lg:col-span-8 flex flex-col">
                    <DashboardRecentDocumentsTable
                        documents={recentDocuments}
                        isLoading={isDashboardLoading}
                    />
                </div>

                {/* Right (4 Cols): Attention Card + Live Activity */}
                <div className="lg:col-span-4 flex flex-col gap-4 sm:gap-5">
                    {/* Priority Attention Card */}
                    <DashboardAttentionCard
                        pendingDocument={topPendingDoc}
                        pendingCount={pendingCount}
                        isLoading={isDashboardLoading}
                    />

                    {/* Live Audit Activity Feed */}
                    <DashboardActivityFeed
                        activities={activities}
                        isLoading={isDashboardLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default DashboardWorkspace;
