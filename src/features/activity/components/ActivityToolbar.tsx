"use client";

import React from "react";
import {
    Search,
    X,
    RefreshCw,
    Filter,
    Layers,
    FileText,
    ShieldCheck,
    FolderKanban,
    Users,
} from "lucide-react";
import { ActivityCategory, AuditAction } from "../activityApi";
import { cn } from "@/lib/utils";

export interface ActivityToolbarProps {
    activeCategory: ActivityCategory;
    onCategoryChange: (cat: ActivityCategory) => void;
    activeAction: string;
    onActionChange: (action: string) => void;
    searchQuery: string;
    onSearchChange: (val: string) => void;
    isFetching: boolean;
    onRefresh: () => void;
    totalCount?: number;
}

const CATEGORY_TABS: { id: ActivityCategory; label: string; icon: React.ElementType }[] = [
    { id: "ALL", label: "All Events", icon: Layers },
    { id: "DOCUMENTS", label: "Documents", icon: FileText },
    { id: "VERIFICATION", label: "Verification", icon: ShieldCheck },
    { id: "PROJECTS", label: "Projects", icon: FolderKanban },
    { id: "TEAM", label: "Team & Access", icon: Users },
];

const ACTION_OPTIONS: Record<ActivityCategory, { value: string; label: string }[]> = {
    ALL: [
        { value: "ALL", label: "All Actions" },
        { value: AuditAction.DOCUMENT_UPLOADED, label: "Document Uploaded" },
        { value: AuditAction.DOCUMENT_TRANSFORMED, label: "Document Transformed" },
        { value: AuditAction.DOCUMENT_VERIFIED, label: "Document Verified" },
        { value: AuditAction.DOCUMENT_REJECTED, label: "Document Rejected" },
        { value: AuditAction.DOCUMENT_DELETED, label: "Document Deleted" },
        { value: AuditAction.PROJECT_CREATED, label: "Project Created" },
        { value: AuditAction.PROJECT_UPDATED, label: "Project Updated" },
        { value: AuditAction.PROJECT_DELETED, label: "Project Deleted" },
        { value: AuditAction.MEMBER_INVITED, label: "Member Invited" },
        { value: AuditAction.MEMBER_ROLE_UPDATED, label: "Role Changed" },
        { value: AuditAction.MEMBER_REMOVED, label: "Member Removed" },
    ],
    DOCUMENTS: [
        { value: "ALL", label: "All Document Actions" },
        { value: AuditAction.DOCUMENT_UPLOADED, label: "Document Uploaded" },
        { value: AuditAction.DOCUMENT_TRANSFORMED, label: "Document Transformed" },
        { value: AuditAction.DOCUMENT_STATUS_CHANGED, label: "Status Changed" },
        { value: AuditAction.DOCUMENT_DELETED, label: "Document Deleted" },
        { value: AuditAction.TEMPLATE_UPLOADED, label: "Template Uploaded" },
        { value: AuditAction.TEMPLATE_PROCESSED, label: "Template Processed" },
    ],
    VERIFICATION: [
        { value: "ALL", label: "All Verification Actions" },
        { value: AuditAction.DOCUMENT_VERIFIED, label: "Document Verified" },
        { value: AuditAction.DOCUMENT_REJECTED, label: "Document Rejected" },
        { value: AuditAction.EXTRACTION_APPROVED, label: "Extraction Approved" },
        { value: AuditAction.EXTRACTION_REJECTED, label: "Extraction Rejected" },
    ],
    PROJECTS: [
        { value: "ALL", label: "All Project Actions" },
        { value: AuditAction.PROJECT_CREATED, label: "Project Created" },
        { value: AuditAction.PROJECT_UPDATED, label: "Project Updated" },
        { value: AuditAction.PROJECT_DELETED, label: "Project Deleted" },
    ],
    TEAM: [
        { value: "ALL", label: "All Team Actions" },
        { value: AuditAction.MEMBER_INVITED, label: "Member Invited" },
        { value: AuditAction.MEMBER_ROLE_UPDATED, label: "Role Changed" },
        { value: AuditAction.MEMBER_REMOVED, label: "Member Removed" },
        { value: AuditAction.INVITE_REVOKED, label: "Invite Revoked" },
        { value: AuditAction.INVITE_ACCEPTED, label: "Invite Accepted" },
    ],
};

const ActivityToolbar: React.FC<ActivityToolbarProps> = ({
    activeCategory,
    onCategoryChange,
    activeAction,
    onActionChange,
    searchQuery,
    onSearchChange,
    isFetching,
    onRefresh,
    totalCount,
}) => {
    const currentActionOptions = ACTION_OPTIONS[activeCategory] || ACTION_OPTIONS.ALL;

    return (
        <div className="bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
            {/* Top Row: Category Tabs & Refresh */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                {/* Category Pills */}
                <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100/90 rounded-lg scrollbar-none">
                    {CATEGORY_TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isSelected = activeCategory === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    onCategoryChange(tab.id);
                                    onActionChange("ALL");
                                }}
                                className={cn(
                                    "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0",
                                    isSelected
                                        ? "bg-white text-slate-900 shadow-xs"
                                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "w-3.5 h-3.5",
                                        isSelected ? "text-primary" : "text-slate-500"
                                    )}
                                />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Right: Live indicator & Refresh */}
                <div className="flex items-center justify-between lg:justify-end gap-2.5">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-medium">Immutable Audit Trail</span>
                        {totalCount !== undefined && (
                            <span className="text-slate-400 font-mono">({totalCount} events)</span>
                        )}
                    </div>

                    <button
                        onClick={onRefresh}
                        disabled={isFetching}
                        title="Refresh activity feed"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin text-primary")} />
                    </button>
                </div>
            </div>

            {/* Bottom Row: Search & Specific Action Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
                {/* Search Input */}
                <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by filename, project, email, or details..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50/50 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary focus:bg-white transition-all"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Specific Action Select */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="relative flex items-center">
                        <Filter className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
                        <select
                            value={activeAction}
                            onChange={(e) => onActionChange(e.target.value)}
                            className="pl-8 pr-7 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer hover:border-slate-300 transition-colors appearance-none font-medium"
                        >
                            {currentActionOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                            ▼
                        </div>
                    </div>

                    {(searchQuery || activeAction !== "ALL" || activeCategory !== "ALL") && (
                        <button
                            onClick={() => {
                                onCategoryChange("ALL");
                                onActionChange("ALL");
                                onSearchChange("");
                            }}
                            className="px-2.5 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityToolbar;
