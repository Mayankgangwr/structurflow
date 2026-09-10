"use client";

import React, { useState } from "react";
import { ProjectPerformanceItem } from "../analyticsApi";
import {
    FolderKanban,
    ShieldCheck,
    Clock,
    HardDrive,
    ArrowUpRight,
    List,
    LayoutGrid,
    FileText,
    CheckCircle2,
    AlertTriangle,
    Layers,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface ProjectPerformanceTableProps {
    projects: ProjectPerformanceItem[];
    selectedProjectId: string;
    onSelectProject: (id: string) => void;
    isLoading?: boolean;
    defaultViewMode?: "table" | "grid";
}

const ProjectPerformanceTable: React.FC<ProjectPerformanceTableProps> = ({
    projects,
    selectedProjectId,
    onSelectProject,
    isLoading,
    defaultViewMode = "table",
}) => {
    const [viewMode, setViewMode] = useState<"table" | "grid">(defaultViewMode);

    const formatStorage = (bytes: number): string => {
        if (!bytes || bytes === 0) return "0 MB";
        const mb = bytes / (1024 * 1024);
        if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
        return `${mb.toFixed(1)} MB`;
    };

    // Find max docs to normalize progress bars
    const maxDocs = projects.reduce((max, p) => Math.max(max, p.totalDocuments), 1);

    return (
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
            {/* Header: Title, Subtitle, Count & View Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <FolderKanban className="w-4 h-4 text-primary" />
                        Project Pipelines Comparison
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Operational health, verification accuracy, and throughput across your projects.
                    </p>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <span className="text-[11px] text-slate-400 font-medium hidden xs:inline">
                        {projects.length} Active {projects.length === 1 ? "Project" : "Projects"}
                    </span>

                    {/* Table / Grid Switcher */}
                    <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 shrink-0">
                        <button
                            type="button"
                            onClick={() => setViewMode("table")}
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
                                viewMode === "table"
                                    ? "bg-white text-primary shadow-xs border border-slate-200"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                            )}
                            title="Table View"
                        >
                            <List className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline text-[11px]">Table</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
                                viewMode === "grid"
                                    ? "bg-white text-primary shadow-xs border border-slate-200"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                            )}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline text-[11px]">Grid</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area: Loading / Empty / Table / Grid */}
            {isLoading ? (
                viewMode === "table" ? (
                    <div className="flex flex-col gap-2 py-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-14 bg-slate-100/70 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 py-2">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-44 bg-slate-100/70 rounded-xl border border-slate-200 animate-pulse"
                            />
                        ))}
                    </div>
                )
            ) : projects.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                        <FolderKanban className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-700">No active projects found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Create a project pipeline to start monitoring throughput and extraction accuracy.
                    </p>
                </div>
            ) : viewMode === "table" ? (
                /* TABLE VIEW */
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                <th className="pb-2.5 font-medium">Project</th>
                                <th className="pb-2.5 font-medium">Throughput & Volume</th>
                                <th className="pb-2.5 font-medium">Accuracy</th>
                                <th className="pb-2.5 font-medium">Backlog</th>
                                <th className="pb-2.5 font-medium">Storage</th>
                                <th className="pb-2.5 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {projects.map((project) => {
                                const isSelected = selectedProjectId === project.id;
                                const volumePercent = Math.round((project.totalDocuments / maxDocs) * 100);

                                let relativeTime = "";
                                try {
                                    relativeTime = formatDistanceToNow(new Date(project.lastActivity), {
                                        addSuffix: true,
                                    });
                                } catch {
                                    relativeTime = "Recently";
                                }

                                return (
                                    <tr
                                        key={project.id}
                                        className={cn(
                                            "group transition-colors hover:bg-slate-50/70",
                                            isSelected && "bg-indigo-50/40"
                                        )}
                                    >
                                        {/* Project Info */}
                                        <td className="py-3 pr-3">
                                            <div className="flex items-center gap-2.5 min-w-44">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                                    {project.name.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-slate-900 group-hover:text-primary transition-colors truncate">
                                                        {project.name}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 truncate">
                                                        {project.templateName ? (
                                                            <span>Template: {project.templateName}</span>
                                                        ) : (
                                                            <span>Active {relativeTime}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Volume & Bar */}
                                        <td className="py-3 pr-4 min-w-36">
                                            <div className="flex items-center justify-between text-[11px] mb-1">
                                                <span className="font-bold text-slate-800 font-mono">
                                                    {project.totalDocuments} docs
                                                </span>
                                                <span className="text-slate-400 font-mono">
                                                    {project.verifiedCount} verified
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-300"
                                                    style={{ width: `${Math.max(5, volumePercent)}%` }}
                                                />
                                            </div>
                                        </td>

                                        {/* Accuracy */}
                                        <td className="py-3 pr-3 whitespace-nowrap">
                                            <span
                                                className={cn(
                                                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold",
                                                    project.successRate >= 90
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        : project.successRate >= 70
                                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                                )}
                                            >
                                                <ShieldCheck className="w-3 h-3" />
                                                <span>{project.successRate}%</span>
                                            </span>
                                        </td>

                                        {/* Backlog */}
                                        <td className="py-3 pr-3 whitespace-nowrap">
                                            {project.backlogCount > 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{project.backlogCount} pending</span>
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 text-[11px]">Clear</span>
                                            )}
                                        </td>

                                        {/* Storage */}
                                        <td className="py-3 pr-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                                            {formatStorage(project.storageBytes)}
                                        </td>

                                        {/* Filter CTA */}
                                        <td className="py-3 text-right whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => onSelectProject(isSelected ? "ALL" : project.id)}
                                                className={cn(
                                                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer",
                                                    isSelected
                                                        ? "bg-primary text-white"
                                                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                                )}
                                            >
                                                <span>{isSelected ? "Filtered" : "Filter"}</span>
                                                <ArrowUpRight className="w-3 h-3" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* GRID VIEW */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {projects.map((project) => {
                        const isSelected = selectedProjectId === project.id;
                        const volumePercent = Math.round((project.totalDocuments / maxDocs) * 100);

                        let relativeTime = "";
                        try {
                            relativeTime = formatDistanceToNow(new Date(project.lastActivity), {
                                addSuffix: true,
                            });
                        } catch {
                            relativeTime = "Recently";
                        }

                        return (
                            <div
                                key={project.id}
                                className={cn(
                                    "bg-white rounded-xl border p-4 flex flex-col justify-between transition-all duration-200 hover:shadow-md relative group",
                                    isSelected
                                        ? "border-primary/80 ring-2 ring-primary/20 bg-indigo-50/20"
                                        : "border-slate-200/80 hover:border-slate-300"
                                )}
                            >
                                {/* Top Header: Avatar, Name, Template, Filter Tag */}
                                <div>
                                    <div className="flex items-start justify-between gap-2 mb-2.5">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                                                {project.name.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h4
                                                    className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate"
                                                    title={project.name}
                                                >
                                                    {project.name}
                                                </h4>
                                                <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                                                    <Clock className="w-3 h-3 shrink-0" />
                                                    <span className="truncate">{relativeTime}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white shrink-0">
                                                Filtered
                                            </span>
                                        )}
                                    </div>

                                    {/* Template Tag */}
                                    {project.templateName && (
                                        <div className="mb-3 flex items-center gap-1 text-[11px] text-indigo-700 bg-indigo-50/70 border border-indigo-100 rounded-md px-2 py-0.5 truncate">
                                            <Layers className="w-3 h-3 shrink-0 text-indigo-500" />
                                            <span className="truncate">Schema: {project.templateName}</span>
                                        </div>
                                    )}

                                    {/* Metrics Grid: Accuracy & Backlog */}
                                    <div className="grid grid-cols-2 gap-2 my-2.5 pt-2 border-t border-slate-100">
                                        {/* Accuracy */}
                                        <div className="p-2 rounded-lg bg-slate-50/80 border border-slate-100 flex flex-col gap-0.5">
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                Accuracy
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                <ShieldCheck
                                                    className={cn(
                                                        "w-3.5 h-3.5",
                                                        project.successRate >= 90
                                                            ? "text-emerald-600"
                                                            : project.successRate >= 70
                                                            ? "text-amber-600"
                                                            : "text-rose-600"
                                                    )}
                                                />
                                                <span className="text-xs font-bold text-slate-800 font-mono">
                                                    {project.successRate}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Backlog */}
                                        <div className="p-2 rounded-lg bg-slate-50/80 border border-slate-100 flex flex-col gap-0.5">
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                Backlog
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                                {project.backlogCount > 0 ? (
                                                    <>
                                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                                        <span className="text-xs font-bold text-amber-800 font-mono">
                                                            {project.backlogCount} pending
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                        <span className="text-xs font-semibold text-slate-500">
                                                            Clear
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Volume Progress Bar */}
                                    <div className="my-2.5">
                                        <div className="flex items-center justify-between text-[11px] mb-1">
                                            <span className="font-semibold text-slate-700">
                                                Volume: <strong className="font-mono text-slate-900">{project.totalDocuments}</strong> docs
                                            </span>
                                            <span className="text-slate-400 text-[10px] font-mono">
                                                {project.verifiedCount} verified
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all duration-300"
                                                style={{ width: `${Math.max(5, volumePercent)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Storage footprint */}
                                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                        <span className="flex items-center gap-1 text-slate-400">
                                            <HardDrive className="w-3 h-3" />
                                            Storage Footprint
                                        </span>
                                        <span className="font-mono font-medium text-slate-700">
                                            {formatStorage(project.storageBytes)}
                                        </span>
                                    </div>
                                </div>

                                {/* Card Footer: Filter Action & Document Link */}
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                    <Link
                                        href={`/documents?projectId=${project.id}`}
                                        className="text-[11px] font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                                    >
                                        <span>Documents</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </Link>

                                    <button
                                        type="button"
                                        onClick={() => onSelectProject(isSelected ? "ALL" : project.id)}
                                        className={cn(
                                            "inline-flex items-center gap-1 px-3 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer",
                                            isSelected
                                                ? "bg-primary text-white hover:bg-primary/90"
                                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                        )}
                                    >
                                        <span>{isSelected ? "Remove Filter" : "Filter Pipeline"}</span>
                                        <ArrowUpRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ProjectPerformanceTable;
