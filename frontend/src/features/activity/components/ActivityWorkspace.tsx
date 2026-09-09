"use client";

import React, { useState } from "react";
import {
    useGetActivitiesQuery,
    useGetActivityStatsQuery,
    ActivityCategory,
} from "../activityApi";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import ActivityKPIHeader from "./ActivityKPIHeader";
import ActivityToolbar from "./ActivityToolbar";
import ActivityTimelineItem from "./ActivityTimelineItem";
import {
    Shield,
    History,
    ChevronLeft,
    ChevronRight,
    SearchX,
    Download,
    FilterX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

const ActivityWorkspace: React.FC = () => {
    const { role } = usePermissions();

    // Filters and Pagination State
    const [page, setPage] = useState<number>(1);
    const [limit] = useState<number>(15);
    const [category, setCategory] = useState<ActivityCategory>("ALL");
    const [action, setAction] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // Queries
    const {
        data: activitiesRes,
        isLoading: isActivitiesLoading,
        isFetching: isActivitiesFetching,
        refetch: refetchActivities,
    } = useGetActivitiesQuery({
        page,
        limit,
        category,
        action,
        search: searchQuery,
    });

    const {
        data: statsRes,
        isLoading: isStatsLoading,
        refetch: refetchStats,
    } = useGetActivityStatsQuery();

    const activities = activitiesRes?.data?.activities || [];
    const pagination = activitiesRes?.data?.pagination;
    const stats = statsRes?.data;

    const handleRefresh = () => {
        refetchActivities();
        refetchStats();
        toast.success("Activity feed refreshed");
    };

    const handleCategoryChange = (newCat: ActivityCategory) => {
        setCategory(newCat);
        setAction("ALL");
        setPage(1);
    };

    const handleActionChange = (newAction: string) => {
        setAction(newAction);
        setPage(1);
    };

    const handleSearchChange = (newSearch: string) => {
        setSearchQuery(newSearch);
        setPage(1);
    };

    const handleResetFilters = () => {
        setCategory("ALL");
        setAction("ALL");
        setSearchQuery("");
        setPage(1);
    };

    // Export current activities as JSON file
    const handleExportJson = () => {
        if (!activities.length) {
            toast.error("No activities to export");
            return;
        }
        try {
            const jsonStr = JSON.stringify(activities, null, 2);
            const blob = new Blob([jsonStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `structurflow_audit_log_${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Audit log exported successfully");
        } catch {
            toast.error("Failed to export audit log");
        }
    };

    return (
        <div className="p-2 xs:px-4 xs:py-4 flex-1 flex flex-col gap-3 max-w-360 mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="font-headline-md text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <History className="w-6 h-6 text-primary" />
                            Activity Log & Audit Trail
                        </h1>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                            <Shield className="w-3.5 h-3.5" />
                            {role || "VIEWER"}
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Tamper-evident audit trail capturing document ingestion, AI transformations, human verifications, and workspace governance.
                    </p>
                </div>

                <Button
                    onClick={handleExportJson}
                    variant="outline"
                    className="text-xs sm:text-sm font-semibold gap-1.5 py-2 px-3.5 cursor-pointer self-start sm:self-auto border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                    <Download className="w-4 h-4 text-slate-500" />
                    <span>Export Audit Trail</span>
                </Button>
            </div>

            {/* KPI Cards */}
            <ActivityKPIHeader
                stats={stats}
                isLoading={isStatsLoading}
                activeCategory={category}
                onCategoryChange={handleCategoryChange}
                onActionReset={() => setAction("ALL")}
            />

            {/* Toolbar: Category tabs, Action dropdown, and Search */}
            <ActivityToolbar
                activeCategory={category}
                onCategoryChange={handleCategoryChange}
                activeAction={action}
                onActionChange={handleActionChange}
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                isFetching={isActivitiesFetching}
                onRefresh={handleRefresh}
                totalCount={pagination?.total}
            />

            {/* Timeline Feed Container */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-3.5 sm:p-5 flex flex-col gap-1 min-h-[400px]">
                {/* Active Filter Chips */}
                {(category !== "ALL" || action !== "ALL" || searchQuery) && (
                    <div className="flex flex-wrap items-center gap-2 pb-3 mb-3 border-b border-slate-100">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Active Filters:
                        </span>
                        {category !== "ALL" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-200">
                                Category: {category}
                            </span>
                        )}
                        {action !== "ALL" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-xs font-medium border border-purple-200">
                                Action: {action}
                            </span>
                        )}
                        {searchQuery && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
                                Search: &quot;{searchQuery}&quot;
                            </span>
                        )}
                        <button
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-rose-600 transition-colors ml-auto cursor-pointer"
                        >
                            <FilterX className="w-3 h-3" />
                            <span>Clear All</span>
                        </button>
                    </div>
                )}

                {/* Loading State */}
                {isActivitiesLoading ? (
                    <div className="flex flex-col gap-4 py-4">
                        {[1, 2, 3, 4, 5].map((idx) => (
                            <div key={idx} className="flex gap-4 items-start animate-pulse">
                                <div className="w-10 h-10 rounded-full bg-slate-100 shrink-0" />
                                <div className="flex-1 p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2">
                                    <div className="h-4 w-48 bg-slate-200 rounded" />
                                    <div className="h-3 w-3/4 bg-slate-100 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
                            <SearchX className="w-7 h-7" />
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-800">
                            No activity events found
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-full mt-1">
                            {searchQuery || category !== "ALL" || action !== "ALL"
                                ? "No audit events match your selected filters. Try broadening your criteria or reset the filters."
                                : "No activity events have been recorded in this organization workspace yet."}
                        </p>
                        {(searchQuery || category !== "ALL" || action !== "ALL") && (
                            <Button
                                onClick={handleResetFilters}
                                variant="outline"
                                className="mt-4 text-xs font-semibold"
                            >
                                Reset Filters
                            </Button>
                        )}
                    </div>
                ) : (
                    /* Timeline List */
                    <div className="flex flex-col">
                        {activities.map((activity, index) => (
                            <ActivityTimelineItem
                                key={activity._id}
                                activity={activity}
                                isLast={index === activities.length - 1}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination Footer */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 mt-2 border-t border-slate-100 text-xs text-slate-500">
                        <div>
                            Showing{" "}
                            <span className="font-semibold text-slate-800">
                                {(pagination.page - 1) * pagination.limit + 1}
                            </span>{" "}
                            to{" "}
                            <span className="font-semibold text-slate-800">
                                {Math.min(pagination.page * pagination.limit, pagination.total)}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-slate-800">
                                {pagination.total.toLocaleString()}
                            </span>{" "}
                            events
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={pagination.page <= 1 || isActivitiesFetching}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-slate-700 cursor-pointer"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span>Previous</span>
                            </button>

                            <span className="px-2 font-medium text-slate-600">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>

                            <button
                                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                disabled={pagination.page >= pagination.totalPages || isActivitiesFetching}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium text-slate-700 cursor-pointer"
                            >
                                <span>Next</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivityWorkspace;
