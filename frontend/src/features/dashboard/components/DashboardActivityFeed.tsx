"use client";

import React from "react";
import Link from "next/link";
import {
    ActivityItem,
    AuditAction,
} from "@/features/activity/activityApi";
import {
    Activity,
    FileUp,
    CheckCircle2,
    XCircle,
    Cpu,
    UserPlus,
    FolderPlus,
    ArrowUpRight,
    Clock,
    Shield,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface DashboardActivityFeedProps {
    activities: ActivityItem[];
    isLoading?: boolean;
}

export const DashboardActivityFeed: React.FC<DashboardActivityFeedProps> = ({
    activities,
    isLoading,
}) => {
    const getActionDisplay = (action: string) => {
        switch (action) {
            case AuditAction.DOCUMENT_UPLOADED:
                return {
                    icon: FileUp,
                    color: "text-sky-600 bg-sky-50 border-sky-200",
                    label: "Document Uploaded",
                };
            case AuditAction.DOCUMENT_TRANSFORMED:
                return {
                    icon: Cpu,
                    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
                    label: "AI Transformed",
                };
            case AuditAction.DOCUMENT_VERIFIED:
            case AuditAction.EXTRACTION_APPROVED:
                return {
                    icon: CheckCircle2,
                    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
                    label: "Document Verified",
                };
            case AuditAction.DOCUMENT_REJECTED:
            case AuditAction.EXTRACTION_REJECTED:
                return {
                    icon: XCircle,
                    color: "text-rose-600 bg-rose-50 border-rose-200",
                    label: "Document Rejected",
                };
            case AuditAction.PROJECT_CREATED:
                return {
                    icon: FolderPlus,
                    color: "text-purple-600 bg-purple-50 border-purple-200",
                    label: "Project Created",
                };
            case AuditAction.MEMBER_INVITED:
                return {
                    icon: UserPlus,
                    color: "text-teal-600 bg-teal-50 border-teal-200",
                    label: "Member Invited",
                };
            default:
                return {
                    icon: Activity,
                    color: "text-slate-600 bg-slate-50 border-slate-200",
                    label: action.replace(/_/g, " ").toLowerCase(),
                };
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                        <Activity className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                            Live Audit Activity
                        </h2>
                        <p className="text-xs text-slate-500">
                            Real-time pipeline & security events
                        </p>
                    </div>
                </div>

                <Link
                    href="/activity"
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors shrink-0"
                >
                    <span>Full Log</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {/* List */}
            <div className="p-4 sm:p-5 pt-3">
                {isLoading ? (
                    <div className="space-y-3.5">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-start gap-3 animate-pulse">
                                <div className="w-7 h-7 bg-slate-200 rounded-full shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="w-32 h-3 bg-slate-200 rounded" />
                                    <div className="w-48 h-2.5 bg-slate-100 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400">
                        No recent activity events recorded.
                    </div>
                ) : (
                    <div className="space-y-3.5">
                        {activities.map((act) => {
                            const { icon: ActionIcon, color, label } = getActionDisplay(act.action);

                            const actorName = act.actorId
                                ? `${act.actorId.firstName || ""} ${act.actorId.lastName || ""}`.trim() ||
                                  act.actorId.email ||
                                  "System"
                                : "System Automated";

                            const docName = act.documentId?.originalFileName;
                            const projectName = act.projectId?.name;

                            const timeAgo = act.createdAt
                                ? formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })
                                : "just now";

                            return (
                                <div
                                    key={act._id}
                                    className="flex items-start gap-3 text-xs group"
                                >
                                    <div
                                        className={cn(
                                            "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border mt-0.5",
                                            color
                                        )}
                                    >
                                        <ActionIcon className="w-3.5 h-3.5" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="font-semibold text-slate-900 truncate">
                                                {label}
                                            </span>
                                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                {timeAgo}
                                            </span>
                                        </div>

                                        <p className="text-slate-500 text-[11px] truncate mt-0.5">
                                            <span className="font-medium text-slate-700">
                                                {actorName}
                                            </span>
                                            {docName ? (
                                                <span className="truncate">
                                                    {" "}• <span className="text-slate-600 font-medium truncate">{docName}</span>
                                                </span>
                                            ) : projectName ? (
                                                <span className="truncate">
                                                    {" "}in <span className="text-slate-600 font-medium truncate">{projectName}</span>
                                                </span>
                                            ) : null}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
