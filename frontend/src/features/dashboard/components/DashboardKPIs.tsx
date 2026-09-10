"use client";

import React from "react";
import {
    FileText,
    AlertTriangle,
    CheckCircle2,
    FolderKanban,
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardKPIsProps {
    totalDocuments: number;
    backlogCount: number;
    verifiedCount: number;
    accuracyRate: number;
    totalProjects: number;
    documentsTrend?: number;
    isLoading?: boolean;
}

const DashboardKPIs: React.FC<DashboardKPIsProps> = ({
    totalDocuments,
    backlogCount,
    verifiedCount,
    accuracyRate,
    totalProjects,
    documentsTrend = 0,
    isLoading,
}) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {/* 1. Total Ingestion Volume */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Total Ingested
                        </span>
                        {isLoading ? (
                            <div className="h-8 w-20 bg-slate-100 rounded animate-pulse my-1.5" />
                        ) : (
                            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight my-1">
                                {totalDocuments.toLocaleString()}
                            </div>
                        )}
                        <div className="text-xs text-slate-500 font-medium truncate">
                            Files in processing pipeline
                        </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 shrink-0">
                        <FileText className="w-5 h-5" />
                    </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1">
                        {documentsTrend >= 0 ? (
                            <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                                <TrendingUp className="w-3 h-3" />
                                +{documentsTrend}%
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-0.5 text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                                <TrendingDown className="w-3 h-3" />
                                {documentsTrend}%
                            </span>
                        )}
                        <span className="text-slate-400 font-medium">vs prior 7 days</span>
                    </div>

                    <Link
                        href="/documents"
                        className="text-slate-400 hover:text-primary transition-colors inline-flex items-center gap-0.5 font-medium"
                    >
                        <span>View</span>
                        <ArrowUpRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>

            {/* 2. Verification Backlog (Actionable) */}
            <Link
                href="/verification"
                className={cn(
                    "p-4 rounded-xl border shadow-xs flex flex-col justify-between transition-all group cursor-pointer",
                    backlogCount > 0
                        ? "bg-amber-50/40 border-amber-200/90 hover:border-amber-400 hover:shadow-md"
                        : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-md"
                )}
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <span
                            className={cn(
                                "text-[11px] font-semibold uppercase tracking-wider",
                                backlogCount > 0 ? "text-amber-700" : "text-slate-500"
                            )}
                        >
                            Needs Verification
                        </span>
                        {isLoading ? (
                            <div className="h-8 w-16 bg-slate-100 rounded animate-pulse my-1.5" />
                        ) : (
                            <div
                                className={cn(
                                    "text-2xl sm:text-3xl font-bold tracking-tight my-1",
                                    backlogCount > 0 ? "text-amber-800" : "text-slate-900"
                                )}
                            >
                                {backlogCount.toLocaleString()}
                            </div>
                        )}
                        <div className="text-xs text-slate-500 font-medium truncate">
                            {backlogCount > 0 ? "Pending human review queue" : "All documents verified"}
                        </div>
                    </div>
                    <div
                        className={cn(
                            "p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-105",
                            backlogCount > 0
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-50 text-emerald-600"
                        )}
                    >
                        {backlogCount > 0 ? (
                            <AlertTriangle className="w-5 h-5" />
                        ) : (
                            <CheckCircle2 className="w-5 h-5" />
                        )}
                    </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100/80 flex items-center justify-between text-[11px]">
                    <span
                        className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                            backlogCount > 0
                                ? "bg-amber-100 text-amber-800 font-bold"
                                : "bg-emerald-50 text-emerald-700 font-semibold"
                        )}
                    >
                        {backlogCount > 0 ? "Action Required" : "Queue Clear"}
                    </span>

                    <span className="text-slate-500 group-hover:text-primary transition-colors inline-flex items-center gap-0.5 font-medium">
                        <span>Review</span>
                        <ArrowUpRight className="w-3 h-3" />
                    </span>
                </div>
            </Link>

            {/* 3. Verification Accuracy */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Accuracy Rate
                        </span>
                        {isLoading ? (
                            <div className="h-8 w-20 bg-slate-100 rounded animate-pulse my-1.5" />
                        ) : (
                            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight my-1">
                                {accuracyRate}%
                            </div>
                        )}
                        <div className="text-xs text-slate-500 font-medium truncate">
                            {verifiedCount.toLocaleString()} successfully verified
                        </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">AI + Human Audit Score</span>
                    <Link
                        href="/analytics"
                        className="text-slate-400 hover:text-primary transition-colors inline-flex items-center gap-0.5 font-medium"
                    >
                        <span>Analytics</span>
                        <ArrowUpRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>

            {/* 4. Active Projects */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Active Pipelines
                        </span>
                        {isLoading ? (
                            <div className="h-8 w-16 bg-slate-100 rounded animate-pulse my-1.5" />
                        ) : (
                            <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight my-1">
                                {totalProjects.toLocaleString()}
                            </div>
                        )}
                        <div className="text-xs text-slate-500 font-medium">
                            Configured workspaces
                        </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 shrink-0">
                        <FolderKanban className="w-5 h-5" />
                    </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Extraction Schemas</span>
                    <Link
                        href="/project"
                        className="text-slate-400 hover:text-primary transition-colors inline-flex items-center gap-0.5 font-medium"
                    >
                        <span>Projects</span>
                        <ArrowUpRight className="w-3 h-3" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default DashboardKPIs;
