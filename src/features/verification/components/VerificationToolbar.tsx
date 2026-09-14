"use client";

import React from "react";
import {
    Search,
    ChevronDown,
    ArrowUpDown,
    Filter,
    Folder,
    CheckCheck,
    Loader2,
    RotateCcw,
    List,
    LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface VerificationToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedProjectId: string;
    onProjectChange: (projectId: string) => void;
    projects?: { id: string; name: string }[];
    stageFilter: string;
    onStageFilterChange: (stage: string) => void;
    sortOrder: "asc" | "desc";
    onToggleSortOrder: () => void;
    selectedCount: number;
    onBulkApprove: () => void;
    isBulkVerifying?: boolean;
    onResetFilters: () => void;
    viewMode?: "table" | "grid";
    onViewModeChange?: (mode: "table" | "grid") => void;
}

const stageOptions = [
    { label: "All Pending Review", value: "NEEDS_VERIFICATION" },
    { label: "Review Required (Low Conf)", value: "REVIEW_REQUIRED" },
    { label: "Transformed (Standard)", value: "TRANSFORMED" },
    { label: "Verified & Approved", value: "VERIFIED" },
    { label: "Rejected / Flagged", value: "REJECTED" },
    { label: "All Documents", value: "ALL" },
];

const VerificationToolbar: React.FC<VerificationToolbarProps> = ({
    searchQuery,
    onSearchChange,
    selectedProjectId,
    onProjectChange,
    projects,
    stageFilter,
    onStageFilterChange,
    sortOrder,
    onToggleSortOrder,
    selectedCount,
    onBulkApprove,
    isBulkVerifying = false,
    onResetFilters,
    viewMode,
    onViewModeChange,
}) => {
    const activeStageLabel =
        stageOptions.find((s) => s.value === stageFilter)?.label || "All Pending Review";

    const activeProjectName =
        projects?.find((p) => p.id === selectedProjectId)?.name || "All Projects";

    return (
        <div className="bg-surface p-2.5 sm:p-3 rounded-xl border border-border-subtle shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Left: Search Box & Bulk Actions */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative flex-1 min-w-0 max-w-full sm:max-w-72">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-secondary w-4 h-4 shrink-0" />
                    <input
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 bg-surface-container-lowest border border-border-subtle rounded-lg text-xs sm:text-sm text-text-primary placeholder-secondary/70 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                        placeholder="Search queue by document name..."
                        type="text"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-secondary hover:text-text-primary p-1 cursor-pointer"
                            title="Clear search"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Right: Filters, FIFO Sorting & Reset */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
                {/* Project Filter */}
                {projects && projects.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            className={cn(
                                "inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 bg-surface border rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0",
                                selectedProjectId && selectedProjectId !== "ALL"
                                    ? "border-amber-500/40 text-amber-700 bg-amber-50/50"
                                    : "border-border-subtle hover:bg-surface-container-low text-text-primary"
                            )}
                            title={`Project: ${activeProjectName}`}
                        >
                            <Folder
                                className={cn(
                                    "w-4 h-4 shrink-0",
                                    selectedProjectId && selectedProjectId !== "ALL" ? "text-amber-600" : "text-secondary"
                                )}
                            />
                            <span className="hidden sm:inline max-w-[110px] truncate">
                                {activeProjectName}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-secondary hidden sm:inline shrink-0" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 max-h-60 overflow-y-auto bg-surface border border-border-subtle">
                            <DropdownMenuItem
                                onClick={() => onProjectChange("ALL")}
                                className={cn(
                                    "cursor-pointer",
                                    (!selectedProjectId || selectedProjectId === "ALL") && "font-semibold text-amber-700 bg-amber-50/60"
                                )}
                            >
                                All Projects
                            </DropdownMenuItem>
                            {projects.map((proj) => (
                                <DropdownMenuItem
                                    key={proj.id}
                                    onClick={() => onProjectChange(proj.id)}
                                    className={cn(
                                        "cursor-pointer truncate",
                                        selectedProjectId === proj.id && "font-semibold text-amber-700 bg-amber-50/60"
                                    )}
                                >
                                    {proj.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {/* Review Stage Filter */}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        className={cn(
                            "inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 bg-surface border rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0",
                            stageFilter !== "NEEDS_VERIFICATION"
                                ? "border-amber-500/40 text-amber-700 bg-amber-50/50"
                                : "border-border-subtle hover:bg-surface-container-low text-text-primary"
                        )}
                        title={`Stage: ${activeStageLabel}`}
                    >
                        <Filter
                            className={cn(
                                "w-4 h-4 shrink-0",
                                stageFilter !== "NEEDS_VERIFICATION" ? "text-amber-600" : "text-secondary"
                            )}
                        />
                        <span className="hidden sm:inline max-w-[120px] truncate">
                            {activeStageLabel}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-secondary hidden sm:inline shrink-0" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-surface border border-border-subtle">
                        {stageOptions.map((opt) => (
                            <DropdownMenuItem
                                key={opt.value}
                                onClick={() => onStageFilterChange(opt.value)}
                                className={cn(
                                    "cursor-pointer",
                                    stageFilter === opt.value && "font-semibold text-amber-700 bg-amber-50/60"
                                )}
                            >
                                {opt.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* FIFO / LIFO Sort Toggle (Oldest First vs Newest First) */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onToggleSortOrder}
                    className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 border-border-subtle px-2.5 py-2 cursor-pointer shrink-0"
                    title={`Sort by queue age: currently ${sortOrder === 'asc' ? 'Oldest First (FIFO)' : 'Newest First'}`}
                >
                    <ArrowUpDown className="w-3.5 h-3.5 text-secondary" />
                    <span className="hidden sm:inline">
                        {sortOrder === "asc" ? "Oldest First (FIFO)" : "Newest First"}
                    </span>
                    <span className="sm:hidden text-[11px] font-semibold">
                        {sortOrder === "asc" ? "FIFO" : "LIFO"}
                    </span>
                </Button>

                {/* Reset Filters */}
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onResetFilters}
                    title="Reset all filters"
                    className="text-secondary hover:text-slate-900 hover:bg-surface-container-low shrink-0"
                >
                    <RotateCcw className="w-4 h-4" />
                </Button>

                {/* Divider - Hidden on Mobile */}
                {viewMode && onViewModeChange && (
                    <>
                        <div className="h-6 w-px bg-border-subtle mx-0.5 hidden sm:block"></div>

                        {/* Table / Grid View Switcher */}
                        <div className="hidden sm:flex items-center p-0.5 bg-surface-container-low rounded-lg border border-border-subtle shrink-0">
                            <button
                                onClick={() => onViewModeChange("table")}
                                className={cn(
                                    "p-1.5 rounded-md transition-all cursor-pointer",
                                    viewMode === "table"
                                        ? "bg-surface text-amber-700 shadow-xs border border-border-subtle font-semibold"
                                        : "text-secondary hover:text-text-primary hover:bg-surface/50"
                                )}
                                title="Table View"
                            >
                                <List className="w-4 h-4 block" />
                            </button>
                            <button
                                onClick={() => onViewModeChange("grid")}
                                className={cn(
                                    "p-1.5 rounded-md transition-all cursor-pointer",
                                    viewMode === "grid"
                                        ? "bg-surface text-amber-700 shadow-xs border border-border-subtle font-semibold"
                                        : "text-secondary hover:text-text-primary hover:bg-surface/50"
                                )}
                                title="Grid View"
                            >
                                <LayoutGrid className="w-4 h-4 block" />
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default VerificationToolbar;
