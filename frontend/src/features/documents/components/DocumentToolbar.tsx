"use client";

import React from "react";
import {
    Search,
    ChevronDown,
    ArrowUpDown,
    SlidersHorizontal,
    Filter,
    List,
    LayoutGrid,
    Folder
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface DocumentToolbarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    statusFilter: string;
    onStatusFilterChange: (status: string) => void;
    sortBy: "createdAt" | "name" | "size" | "status";
    sortOrder: "asc" | "desc";
    onSortChange: (field: "createdAt" | "name" | "size" | "status") => void;
    viewMode: "table" | "grid";
    onViewModeChange: (mode: "table" | "grid") => void;
    onResetFilters: () => void;
    projects?: { id: string; name: string }[];
    selectedProjectId?: string;
    onProjectChange?: (projectId: string) => void;
}

const statusOptions = [
    { label: "All Statuses", value: "ALL" },
    { label: "Uploaded", value: "UPLOADED" },
    { label: "Processing", value: "PROCESSING" },
    { label: "Transformed", value: "TRANSFORMED" },
    { label: "Verified", value: "VERIFIED" },
    { label: "Exported", value: "EXPORTED" },
    { label: "Review Required", value: "REVIEW_REQUIRED" },
    { label: "Failed", value: "FAILED" },
];

const DocumentToolbar: React.FC<DocumentToolbarProps> = ({
    searchQuery,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    sortBy,
    sortOrder,
    onSortChange,
    viewMode,
    onViewModeChange,
    onResetFilters,
    projects,
    selectedProjectId,
    onProjectChange,
}) => {
    const activeStatusLabel =
        statusOptions.find((s) => s.value === statusFilter)?.label || "All Statuses";

    const activeProjectName =
        projects?.find((p) => p.id === selectedProjectId)?.name || "All Projects";

    return (
        <div className="bg-surface p-2.5 sm:p-3 rounded-xl border border-border-subtle shadow-xs flex flex-row items-center justify-between gap-2 mb-2">
            {/* Search Box - Flex-1 so it takes available space */}
            <div className="relative flex-1 min-w-0 lg:max-w-80">
                <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 text-secondary w-4 h-4 shrink-0" />
                <input
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-2 bg-surface-container-lowest border border-border-subtle rounded-lg text-xs sm:text-sm text-text-primary placeholder-secondary/70 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Search documents..."
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

            {/* Filter Controls & View Switcher */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Optional Project Filter Dropdown */}
                {projects && projects.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            className={cn(
                                "inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 bg-surface border rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0",
                                selectedProjectId && selectedProjectId !== "ALL"
                                    ? "border-primary/40 text-primary bg-primary/5"
                                    : "border-border-subtle hover:bg-surface-container-low text-text-primary"
                            )}
                            title={`Project: ${activeProjectName}`}
                        >
                            <Folder
                                className={cn(
                                    "w-4 h-4 shrink-0",
                                    selectedProjectId && selectedProjectId !== "ALL" ? "text-primary" : "text-secondary"
                                )}
                            />
                            <span className="hidden sm:inline max-w-[110px] truncate">
                                {activeProjectName}
                            </span>
                            <ChevronDown className="w-3.5 h-3.5 text-secondary hidden sm:inline shrink-0" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52 max-h-60 overflow-y-auto bg-surface border border-border-subtle">
                            <DropdownMenuItem
                                onClick={() => onProjectChange && onProjectChange("ALL")}
                                className={cn(
                                    "cursor-pointer",
                                    (!selectedProjectId || selectedProjectId === "ALL") && "font-semibold text-primary"
                                )}
                            >
                                All Projects
                            </DropdownMenuItem>
                            {projects.map((proj) => (
                                <DropdownMenuItem
                                    key={proj.id}
                                    onClick={() => onProjectChange && onProjectChange(proj.id)}
                                    className={cn(
                                        "cursor-pointer truncate",
                                        selectedProjectId === proj.id && "font-semibold text-primary"
                                    )}
                                >
                                    {proj.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}

                {/* Status Filter Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        className={cn(
                            "inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 bg-surface border rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer shrink-0",
                            statusFilter !== "ALL"
                                ? "border-primary/40 text-primary bg-primary/5"
                                : "border-border-subtle hover:bg-surface-container-low text-text-primary"
                        )}
                        title={`Status: ${activeStatusLabel}`}
                    >
                        <Filter
                            className={cn(
                                "w-4 h-4 shrink-0",
                                statusFilter !== "ALL" ? "text-primary" : "text-secondary"
                            )}
                        />
                        <span className="hidden sm:inline max-w-[100px] truncate">
                            {activeStatusLabel}
                        </span>
                        <ChevronDown className="w-3.5 h-3.5 text-secondary hidden sm:inline shrink-0" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-surface border border-border-subtle">
                        {statusOptions.map((opt) => (
                            <DropdownMenuItem
                                key={opt.value}
                                onClick={() => onStatusFilterChange(opt.value)}
                                className={cn(
                                    "cursor-pointer",
                                    statusFilter === opt.value && "font-semibold text-primary"
                                )}
                            >
                                {opt.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 bg-surface border border-border-subtle hover:bg-surface-container-low rounded-lg text-xs sm:text-sm font-medium text-text-primary transition-colors cursor-pointer shrink-0"
                        title="Sort documents"
                    >
                        <ArrowUpDown className="w-4 h-4 text-secondary shrink-0" />
                        <span className="hidden sm:inline">Sort</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-surface border border-border-subtle">
                        <DropdownMenuItem onClick={() => onSortChange("createdAt")} className="cursor-pointer">
                            Upload Date {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("name")} className="cursor-pointer">
                            Document Name {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("size")} className="cursor-pointer">
                            File Size {sortBy === "size" && (sortOrder === "asc" ? "↑" : "↓")}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSortChange("status")} className="cursor-pointer">
                            Status {sortBy === "status" && (sortOrder === "asc" ? "↑" : "↓")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Quick Filters */}
                <DropdownMenu>
                    <DropdownMenuTrigger
                        className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-3 sm:py-2 bg-surface border border-border-subtle hover:bg-surface-container-low rounded-lg text-xs sm:text-sm font-medium text-text-primary transition-colors cursor-pointer shrink-0"
                        title="Filter presets"
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
                        <DropdownMenuItem onClick={() => onStatusFilterChange("UPLOADED")} className="cursor-pointer">
                            Needs Processing (Uploaded)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusFilterChange("TRANSFORMED")} className="cursor-pointer">
                            Needs Verification (Transformed)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusFilterChange("VERIFIED")} className="cursor-pointer">
                            Verified Documents
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onStatusFilterChange("EXPORTED")} className="cursor-pointer">
                            Exported Documents
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Divider - Hidden on Mobile */}
                <div className="h-6 w-px bg-border-subtle mx-0.5 hidden sm:block"></div>

                {/* Table / Grid View Switcher */}
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

export default DocumentToolbar;
