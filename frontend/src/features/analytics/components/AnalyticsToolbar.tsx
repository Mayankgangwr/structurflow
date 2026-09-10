"use client";

import React from "react";
import {
    Calendar,
    FolderKanban,
    RefreshCw,
    Download,
    FileSpreadsheet,
    FileCode,
} from "lucide-react";
import { ProjectPerformanceItem } from "../analyticsApi";
import { cn } from "@/lib/utils";

export interface AnalyticsToolbarProps {
    period: "7d" | "30d" | "90d" | "all";
    onPeriodChange: (p: "7d" | "30d" | "90d" | "all") => void;
    selectedProjectId: string;
    onProjectChange: (id: string) => void;
    projects: ProjectPerformanceItem[];
    isFetching: boolean;
    onRefresh: () => void;
    onExportCsv: () => void;
    onExportJson: () => void;
}

const PERIOD_OPTIONS: { id: "7d" | "30d" | "90d" | "all"; label: string }[] = [
    { id: "7d", label: "Last 7 Days" },
    { id: "30d", label: "Last 30 Days" },
    { id: "90d", label: "Last 90 Days" },
    { id: "all", label: "All Time" },
];

const AnalyticsToolbar: React.FC<AnalyticsToolbarProps> = ({
    period,
    onPeriodChange,
    selectedProjectId,
    onProjectChange,
    projects,
    isFetching,
    onRefresh,
    onExportCsv,
    onExportJson,
}) => {
    return (
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Left: Period Switcher Pills */}
            <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100/90 rounded-lg scrollbar-none shrink-0">
                <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5 shrink-0 hidden xs:block" />
                {PERIOD_OPTIONS.map((opt) => {
                    const isSelected = period === opt.id;
                    return (
                        <button
                            key={opt.id}
                            onClick={() => onPeriodChange(opt.id)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap",
                                isSelected
                                    ? "bg-white text-slate-900 shadow-xs"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                            )}
                        >
                            {opt.label}
                        </button>
                    );
                })}
            </div>

            {/* Right: Project Filter & Export Actions */}
            <div className="flex flex-wrap items-center justify-between md:justify-end gap-2.5">
                {/* Project Dropdown */}
                <div className="relative flex items-center min-w-40 sm:min-w-48">
                    <FolderKanban className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
                    <select
                        value={selectedProjectId}
                        onChange={(e) => onProjectChange(e.target.value)}
                        className="w-full pl-8 pr-7 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer hover:border-slate-300 transition-colors appearance-none font-medium truncate"
                    >
                        <option value="ALL">All Projects ({projects.length})</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                    <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                        ▼
                    </div>
                </div>

                {/* Export Buttons */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={onExportCsv}
                        title="Export analytics as CSV spreadsheet"
                        className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Export CSV</span>
                    </button>

                    <button
                        onClick={onExportJson}
                        title="Export raw analytics data as JSON"
                        className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                        <FileCode className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="hidden sm:inline">Export JSON</span>
                    </button>

                    <button
                        onClick={onRefresh}
                        disabled={isFetching}
                        title="Refresh analytics metrics"
                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin text-primary")} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsToolbar;
