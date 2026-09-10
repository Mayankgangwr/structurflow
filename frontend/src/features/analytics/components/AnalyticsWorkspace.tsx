"use client";

import React, { useState } from "react";
import {
    useGetDashboardAnalyticsQuery,
    AnalyticsQueryParams,
} from "../analyticsApi";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import AnalyticsKPIHeader from "./AnalyticsKPIHeader";
import AnalyticsToolbar from "./AnalyticsToolbar";
import ThroughputAreaChart from "./ThroughputAreaChart";
import StatusDistributionChart from "./StatusDistributionChart";
import ProjectPerformanceTable from "./ProjectPerformanceTable";
import ReviewerEfficiencyCard from "./ReviewerEfficiencyCard";
import { BarChart3, Shield } from "lucide-react";
import toast from "react-hot-toast";

const AnalyticsWorkspace: React.FC = () => {
    const { role } = usePermissions();

    // Query states
    const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "all">("30d");
    const [selectedProjectId, setSelectedProjectId] = useState<string>("ALL");

    // Fetch dashboard analytics
    const {
        data: analyticsRes,
        isLoading,
        isFetching,
        refetch,
    } = useGetDashboardAnalyticsQuery({
        period,
        projectId: selectedProjectId,
    });

    const data = analyticsRes?.data;
    const overview = data?.overview;
    const timeSeries = data?.timeSeries || [];
    const statusDistribution = data?.statusDistribution || [];
    const totalStatusCount = data?.totalStatusCount || 0;
    const projects = data?.projects || [];
    const reviewers = data?.reviewers || [];

    const handleRefresh = () => {
        refetch();
        toast.success("Analytics metrics updated");
    };

    // Export CSV handler
    const handleExportCsv = () => {
        if (!timeSeries.length && !projects.length) {
            toast.error("No analytics data available to export");
            return;
        }

        try {
            let csvContent = "data:text/csv;charset=utf-8,";

            // Section 1: Executive KPI Overview
            csvContent += "EXECUTIVE OVERVIEW\n";
            csvContent += "Total Documents,Verified Documents,Rejected Documents,Backlog,Accuracy Rate (%),Storage (Bytes)\n";
            csvContent += `${overview?.totalDocuments || 0},${overview?.verifiedDocuments || 0},${overview?.rejectedDocuments || 0},${overview?.backlogCount || 0},${overview?.accuracyRate || 0},${overview?.storageBytes || 0}\n\n`;

            // Section 2: Daily Throughput Time-Series
            csvContent += "THROUGHPUT TIME-SERIES\n";
            csvContent += "Date,Uploaded,Transformed,Verified,Rejected\n";
            timeSeries.forEach((p) => {
                csvContent += `${p.date},${p.uploaded},${p.transformed},${p.verified},${p.rejected}\n`;
            });
            csvContent += "\n";

            // Section 3: Projects Breakdown
            csvContent += "PROJECT PERFORMANCE\n";
            csvContent += "Project Name,Total Documents,Verified,Rejected,Backlog,Success Rate (%),Storage (Bytes)\n";
            projects.forEach((proj) => {
                csvContent += `"${proj.name}",${proj.totalDocuments},${proj.verifiedCount},${proj.rejectedCount},${proj.backlogCount},${proj.successRate},${proj.storageBytes}\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute(
                "download",
                `structurflow_analytics_${period}_${new Date().toISOString().split("T")[0]}.csv`
            );
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("CSV report exported successfully");
        } catch {
            toast.error("Failed to generate CSV report");
        }
    };

    // Export JSON handler
    const handleExportJson = () => {
        if (!data) {
            toast.error("No analytics data to export");
            return;
        }
        try {
            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `structurflow_analytics_${period}_${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Analytics JSON exported successfully");
        } catch {
            toast.error("Failed to export analytics data");
        }
    };

    const getPeriodLabel = () => {
        switch (period) {
            case "7d":
                return "vs prior 7 days";
            case "90d":
                return "vs prior 90 days";
            case "all":
                return "historical benchmark";
            case "30d":
            default:
                return "vs prior 30 days";
        }
    };

    return (
        <div className="p-2 xs:px-4 xs:py-4 flex-1 flex flex-col gap-3 max-w-360 mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="font-headline-md text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <BarChart3 className="w-6 h-6 text-primary" />
                            Analytics & Performance Intelligence
                        </h1>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                            <Shield className="w-3.5 h-3.5" />
                            {role || "VIEWER"}
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Real-time operational insights on document ingestion throughput, AI extraction accuracy, and human verification velocity.
                    </p>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <AnalyticsKPIHeader
                overview={overview}
                isLoading={isLoading}
                periodLabel={getPeriodLabel()}
            />

            {/* Filter & Export Toolbar */}
            <AnalyticsToolbar
                period={period}
                onPeriodChange={setPeriod}
                selectedProjectId={selectedProjectId}
                onProjectChange={setSelectedProjectId}
                projects={projects}
                isFetching={isFetching}
                onRefresh={handleRefresh}
                onExportCsv={handleExportCsv}
                onExportJson={handleExportJson}
            />

            {/* Visual Charts Grid: Throughput & Status Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                <div className="lg:col-span-7 flex flex-col">
                    <ThroughputAreaChart data={timeSeries} isLoading={isLoading} />
                </div>
                <div className="lg:col-span-5 flex flex-col">
                    <StatusDistributionChart
                        data={statusDistribution}
                        total={totalStatusCount}
                        isLoading={isLoading}
                    />
                </div>
            </div>

            {/* Project Pipelines Comparison */}
            <ProjectPerformanceTable
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectProject={setSelectedProjectId}
                isLoading={isLoading}
            />

            {/* Reviewer Efficiency Leaderboard */}
            <ReviewerEfficiencyCard reviewers={reviewers} isLoading={isLoading} />
        </div>
    );
};

export default AnalyticsWorkspace;
