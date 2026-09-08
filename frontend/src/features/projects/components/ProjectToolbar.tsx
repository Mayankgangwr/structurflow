"use client";

import React from "react";
import {
    Search,
    ChevronDown,
    ArrowUpDown,
    SlidersHorizontal,
    Filter,
    List,
    LayoutGrid
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export interface ProjectToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    statusFilter: string;
    onStatusFilterChange: (status: string) => void;
    onSortChange: (field: "lastActivity" | "name" | "documents" | "needsVerification" | "successRate") => void;
    viewMode: "table" | "grid";
    onViewModeChange: (mode: "table" | "grid") => void;
    onResetFilters: () => void;
}

const ProjectToolbar: React.FC<ProjectToolbarProps> = ({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    onSortChange,
    viewMode,
    onViewModeChange,
    onResetFilters
}) => {
    return (
        <div className="bg-surface p-2.5 sm:p-3 rounded-xl border border-border-subtle shadow-xs mb-6 flex flex-row items-center justify-between gap-2">
            {/* Search Box - Flex-1 so it occupies available space on same row */}
            <div className="relative flex-1 min-w-0 lg:max-w-96">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-secondary w-4 h-4 shrink-0" />
                <input
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 bg-surface-container-lowest border border-border-subtle rounded-lg text-xs sm:text-sm text-text-primary placeholder-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Search projects..."
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

            {/* Filter Controls & View Switcher - Single row on mobile with icon-only buttons */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Status Filter Dropdown (Icon only on mobile, label on sm+) */}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        className={cn(
                            "inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 bg-surface border rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0",
                            statusFilter !== "ALL"
                                ? "border-primary/40 text-primary bg-primary/5"
                                : "border-border-subtle hover:bg-surface-container-low text-text-primary"
                        )}
                        title={`Status: ${statusFilter === "ALL" ? "All Statuses" : statusFilter}`}
                    >
                        <Filter className={cn("w-4 h-4 shrink-0", statusFilter !== "ALL" ? "text-primary" : "text-secondary")} />
                        <span className="hidden sm:inline max-w-[110px] truncate">
                            {statusFilter === "ALL" ? "All Statuses" : statusFilter}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-secondary hidden sm:inline shrink-0" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-surface border border-border-subtle">
                        <DropdownMenuItem onClick={() => onStatusFilterChange("ALL")} className="cursor-pointer">
                            All Statuses
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusFilterChange("Active")} className="cursor-pointer">
                            Active
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusFilterChange("Inactive")} className="cursor-pointer">
                            Inactive
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusFilterChange("Needs Verification")} className="cursor-pointer">
                            Needs Verification
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusFilterChange("Processing")} className="cursor-pointer">
                            Processing
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort Filter Dropdown (Icon only on mobile, label on sm+) */}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 bg-surface border border-border-subtle hover:bg-surface-container-low rounded-lg text-xs sm:text-sm font-medium text-text-primary transition-colors cursor-pointer shrink-0"
                        title="Sort projects"
                    >
                        <ArrowUpDown className="w-4 h-4 text-secondary shrink-0" />
                        <span className="hidden sm:inline">Sort</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-surface border border-border-subtle">
                        <DropdownMenuItem onClick={() => onSortChange("lastActivity")} className="cursor-pointer">
                            Last Activity
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("name")} className="cursor-pointer">
                            Project Name
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("documents")} className="cursor-pointer">
                            Documents Count
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("needsVerification")} className="cursor-pointer">
                            Needs Verification
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("successRate")} className="cursor-pointer">
                            Success Rate
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Advanced / Quick Filter Dropdown (Icon only on mobile, label on sm+) */}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 bg-surface border border-border-subtle hover:bg-surface-container-low rounded-lg text-xs sm:text-sm font-medium text-text-primary transition-colors cursor-pointer shrink-0"
                        title="Filter options"
                    >
                        <SlidersHorizontal className="w-4 h-4 text-secondary shrink-0" />
                        <span className="hidden sm:inline">Filter</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-surface border border-border-subtle">
                        <div className="px-2 py-1.5 text-xs font-semibold text-secondary uppercase tracking-wider">
                            Quick Filters
                        </div>
                        <DropdownMenuItem onClick={onResetFilters} className="cursor-pointer">
                            Reset All Filters
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusFilterChange("Needs Verification")} className="cursor-pointer">
                            Needs Verification
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusFilterChange("Active")} className="cursor-pointer">
                            Active Projects
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusFilterChange("Processing")} className="cursor-pointer">
                            In Processing
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Divider - Hidden on Mobile */}
                <div className="h-6 w-px bg-border-subtle mx-0.5 hidden sm:block"></div>

                {/* Table / Grid View Switcher - Hidden on Mobile */}
                <div className="hidden sm:flex items-center p-0.5 bg-surface-container-low rounded-lg border border-border-subtle shrink-0">
                    <button
                        onClick={() => onViewModeChange("table")}
                        className={cn(
                            "p-1.5 rounded-md transition-all cursor-pointer",
                            viewMode === "table"
                                ? "bg-surface text-primary shadow-xs border border-border-subtle font-semibold"
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
                                ? "bg-surface text-primary shadow-xs border border-border-subtle font-semibold"
                                : "text-secondary hover:text-text-primary hover:bg-surface/50"
                        )}
                        title="Grid View"
                    >
                        <LayoutGrid className="w-4 h-4 block" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectToolbar;
