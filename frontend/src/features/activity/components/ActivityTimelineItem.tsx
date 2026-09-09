"use client";

import React, { useState } from "react";
import {
    ActivityItem,
    AuditAction,
    ActivityActor,
    ActivityDocument,
    ActivityProject,
} from "../activityApi";
import {
    FileUp,
    CheckCircle2,
    XCircle,
    Trash2,
    RefreshCw,
    FolderPlus,
    FolderEdit,
    FolderX,
    UserPlus,
    UserMinus,
    UserCog,
    MailX,
    UserCheck,
    Cpu,
    FileCheck,
    LogIn,
    LogOut,
    Shield,
    Globe,
    ChevronDown,
    ChevronUp,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";

interface TimelineItemProps {
    activity: ActivityItem;
    isLast?: boolean;
}

interface ActionConfig {
    icon: React.ElementType;
    color: string;
    bg: string;
    border: string;
    badgeBg: string;
    badgeText: string;
    label: string;
}

const ACTION_CONFIGS: Record<string, ActionConfig> = {
    [AuditAction.DOCUMENT_UPLOADED]: {
        icon: FileUp,
        color: "text-sky-600",
        bg: "bg-sky-50",
        border: "border-sky-200",
        badgeBg: "bg-sky-100/70",
        badgeText: "text-sky-800",
        label: "Document Uploaded",
    },
    [AuditAction.DOCUMENT_TRANSFORMED]: {
        icon: Cpu,
        color: "text-indigo-600",
        bg: "bg-indigo-50",
        border: "border-indigo-200",
        badgeBg: "bg-indigo-100/70",
        badgeText: "text-indigo-800",
        label: "AI Transformed",
    },
    [AuditAction.DOCUMENT_VERIFIED]: {
        icon: CheckCircle2,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        badgeBg: "bg-emerald-100/70",
        badgeText: "text-emerald-800",
        label: "Document Verified",
    },
    [AuditAction.DOCUMENT_REJECTED]: {
        icon: XCircle,
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-200",
        badgeBg: "bg-rose-100/70",
        badgeText: "text-rose-800",
        label: "Document Rejected",
    },
    [AuditAction.DOCUMENT_DELETED]: {
        icon: Trash2,
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-200",
        badgeBg: "bg-rose-100/70",
        badgeText: "text-rose-800",
        label: "Document Deleted",
    },
    [AuditAction.DOCUMENT_STATUS_CHANGED]: {
        icon: RefreshCw,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        badgeBg: "bg-amber-100/70",
        badgeText: "text-amber-800",
        label: "Status Changed",
    },
    [AuditAction.EXTRACTION_APPROVED]: {
        icon: FileCheck,
        color: "text-teal-600",
        bg: "bg-teal-50",
        border: "border-teal-200",
        badgeBg: "bg-teal-100/70",
        badgeText: "text-teal-800",
        label: "Extraction Approved",
    },
    [AuditAction.EXTRACTION_REJECTED]: {
        icon: XCircle,
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-200",
        badgeBg: "bg-rose-100/70",
        badgeText: "text-rose-800",
        label: "Extraction Rejected",
    },
    [AuditAction.PROJECT_CREATED]: {
        icon: FolderPlus,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-200",
        badgeBg: "bg-blue-100/70",
        badgeText: "text-blue-800",
        label: "Project Created",
    },
    [AuditAction.PROJECT_UPDATED]: {
        icon: FolderEdit,
        color: "text-amber-600",
        bg: "bg-amber-50",
        border: "border-amber-200",
        badgeBg: "bg-amber-100/70",
        badgeText: "text-amber-800",
        label: "Project Updated",
    },
    [AuditAction.PROJECT_DELETED]: {
        icon: FolderX,
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-200",
        badgeBg: "bg-rose-100/70",
        badgeText: "text-rose-800",
        label: "Project Deleted",
    },
    [AuditAction.MEMBER_INVITED]: {
        icon: UserPlus,
        color: "text-purple-600",
        bg: "bg-purple-50",
        border: "border-purple-200",
        badgeBg: "bg-purple-100/70",
        badgeText: "text-purple-800",
        label: "Member Invited",
    },
    [AuditAction.MEMBER_ROLE_UPDATED]: {
        icon: UserCog,
        color: "text-indigo-600",
        bg: "bg-indigo-50",
        border: "border-indigo-200",
        badgeBg: "bg-indigo-100/70",
        badgeText: "text-indigo-800",
        label: "Role Updated",
    },
    [AuditAction.MEMBER_REMOVED]: {
        icon: UserMinus,
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-200",
        badgeBg: "bg-rose-100/70",
        badgeText: "text-rose-800",
        label: "Member Removed",
    },
    [AuditAction.INVITE_REVOKED]: {
        icon: MailX,
        color: "text-slate-600",
        bg: "bg-slate-100",
        border: "border-slate-200",
        badgeBg: "bg-slate-200/70",
        badgeText: "text-slate-800",
        label: "Invite Revoked",
    },
    [AuditAction.INVITE_ACCEPTED]: {
        icon: UserCheck,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        badgeBg: "bg-emerald-100/70",
        badgeText: "text-emerald-800",
        label: "Invite Accepted",
    },
    [AuditAction.USER_LOGGED_IN]: {
        icon: LogIn,
        color: "text-slate-600",
        bg: "bg-slate-50",
        border: "border-slate-200",
        badgeBg: "bg-slate-100",
        badgeText: "text-slate-700",
        label: "Logged In",
    },
    [AuditAction.USER_LOGGED_OUT]: {
        icon: LogOut,
        color: "text-slate-600",
        bg: "bg-slate-50",
        border: "border-slate-200",
        badgeBg: "bg-slate-100",
        badgeText: "text-slate-700",
        label: "Logged Out",
    },
};

const DEFAULT_CONFIG: ActionConfig = {
    icon: Shield,
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    label: "Audit Event",
};

const ActivityTimelineItem: React.FC<TimelineItemProps> = ({ activity, isLast = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const config = ACTION_CONFIGS[activity.action] || DEFAULT_CONFIG;
    const Icon = config.icon;

    // Actor details
    const actor = typeof activity.actorId === "object" ? (activity.actorId as ActivityActor) : null;
    const actorName = actor
        ? `${actor.firstName || ""} ${actor.lastName || ""}`.trim() || actor.email || "Workspace Member"
        : "Automated Pipeline / System";

    // Related entities
    const doc =
        typeof activity.documentId === "object" ? (activity.documentId as ActivityDocument) : null;
    const proj =
        typeof activity.projectId === "object" ? (activity.projectId as ActivityProject) : null;

    // Dates
    let relativeTime = "";
    let absoluteTime = "";
    try {
        const d = new Date(activity.createdAt);
        relativeTime = formatDistanceToNow(d, { addSuffix: true });
        absoluteTime = format(d, "MMM d, yyyy 'at' h:mm:ss a");
    } catch {
        relativeTime = "Recently";
        absoluteTime = activity.createdAt;
    }

    // Generate human-friendly action text and key details
    const renderActionDescription = () => {
        const details = activity.details || {};
        const filename =
            details.originalFileName ||
            details.fileName ||
            doc?.originalFileName ||
            details.name;
        const projectName = details.projectName || proj?.name;
        const targetEmail = details.targetEmail || details.email;

        switch (activity.action) {
            case AuditAction.DOCUMENT_UPLOADED:
                return (
                    <span>
                        uploaded document{" "}
                        <span className="font-semibold text-slate-900">
                            {filename || "unnamed file"}
                        </span>
                        {projectName && (
                            <span className="text-slate-500 font-normal">
                                {" "}in project <span className="font-medium text-slate-700">{projectName}</span>
                            </span>
                        )}
                    </span>
                );
            case AuditAction.DOCUMENT_TRANSFORMED:
                return (
                    <span>
                        AI transformation processed{" "}
                        <span className="font-semibold text-slate-900">
                            {filename || "document"}
                        </span>
                        {details.confidenceScore !== undefined && (
                            <span className="inline-flex items-center ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {Math.round(details.confidenceScore * 100)}% match
                            </span>
                        )}
                    </span>
                );
            case AuditAction.DOCUMENT_VERIFIED:
                return (
                    <span>
                        verified and approved document{" "}
                        <span className="font-semibold text-slate-900">
                            {filename || "document"}
                        </span>
                    </span>
                );
            case AuditAction.DOCUMENT_REJECTED:
                return (
                    <span>
                        rejected document{" "}
                        <span className="font-semibold text-slate-900">
                            {filename || "document"}
                        </span>
                        {details.reason && (
                            <span className="text-rose-600 block sm:inline sm:ml-1 text-xs font-normal">
                                (Reason: &quot;{details.reason}&quot;)
                            </span>
                        )}
                    </span>
                );
            case AuditAction.DOCUMENT_DELETED:
                return (
                    <span>
                        permanently deleted document{" "}
                        <span className="font-semibold text-slate-900">
                            {filename || "document"}
                        </span>
                    </span>
                );
            case AuditAction.DOCUMENT_STATUS_CHANGED:
                return (
                    <span>
                        transitioned document status{" "}
                        {details.fromStatus && (
                            <>
                                from <span className="font-mono text-[11px] font-semibold text-slate-600">{details.fromStatus}</span>
                            </>
                        )}{" "}
                        to <span className="font-mono text-[11px] font-semibold text-indigo-700">{details.toStatus || details.status}</span>
                    </span>
                );
            case AuditAction.PROJECT_CREATED:
                return (
                    <span>
                        created new project{" "}
                        <span className="font-semibold text-slate-900">
                            {projectName || "project"}
                        </span>
                    </span>
                );
            case AuditAction.PROJECT_UPDATED:
                return (
                    <span>
                        updated project settings for{" "}
                        <span className="font-semibold text-slate-900">
                            {projectName || "project"}
                        </span>
                    </span>
                );
            case AuditAction.PROJECT_DELETED:
                return (
                    <span>
                        deleted project{" "}
                        <span className="font-semibold text-slate-900">
                            {projectName || "project"}
                        </span>
                    </span>
                );
            case AuditAction.MEMBER_INVITED:
                return (
                    <span>
                        invited{" "}
                        <span className="font-semibold text-slate-900">
                            {targetEmail || "member"}
                        </span>{" "}
                        with role{" "}
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-800">
                            {details.role || "MEMBER"}
                        </span>
                    </span>
                );
            case AuditAction.MEMBER_ROLE_UPDATED:
                return (
                    <span>
                        updated role for{" "}
                        <span className="font-semibold text-slate-900">
                            {targetEmail || "member"}
                        </span>{" "}
                        to{" "}
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-800">
                            {details.newRole}
                        </span>
                        {details.previousRole && (
                            <span className="text-slate-400 text-xs font-normal">
                                {" "}(was {details.previousRole})
                            </span>
                        )}
                    </span>
                );
            case AuditAction.MEMBER_REMOVED:
                return (
                    <span>
                        removed{" "}
                        <span className="font-semibold text-slate-900">
                            {targetEmail || "member"}
                        </span>{" "}
                        from the workspace
                    </span>
                );
            case AuditAction.INVITE_REVOKED:
                return (
                    <span>
                        revoked invitation for{" "}
                        <span className="font-semibold text-slate-900">
                            {targetEmail || "collaborator"}
                        </span>
                    </span>
                );
            case AuditAction.INVITE_ACCEPTED:
                return (
                    <span>
                        accepted invitation and joined the organization
                    </span>
                );
            default:
                return (
                    <span>
                        performed <span className="font-mono text-xs text-slate-700">{activity.action}</span>
                    </span>
                );
        }
    };

    const hasExtraDetails =
        activity.details &&
        Object.keys(activity.details).length > 0;

    return (
        <div className="relative flex gap-3.5 sm:gap-4 group">
            {/* Timeline Vertical Guide Line */}
            {!isLast && (
                <span
                    className="absolute left-4.5 sm:left-5 top-10 -bottom-3.5 w-0.5 bg-slate-200 group-hover:bg-slate-300 transition-colors"
                    aria-hidden="true"
                />
            )}

            {/* Action Icon Node */}
            <div
                className={cn(
                    "relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105",
                    config.bg,
                    config.border
                )}
            >
                <Icon className={cn("w-4 h-4 sm:w-4.5 sm:h-4.5", config.color)} />
            </div>

            {/* Event Card Content */}
            <div className="flex-1 pb-4 min-w-0">
                <div className="p-3 sm:p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col gap-2">
                    {/* Top Row: Actor, Action badge & Timestamp */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                            {/* Actor Avatar or Initials */}
                            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-[11px] font-bold text-slate-700 uppercase overflow-hidden">
                                {actor?.avatar ? (
                                    <img
                                        src={actor.avatar}
                                        alt={actorName}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    actorName.slice(0, 2)
                                )}
                            </div>

                            <span className="text-xs font-semibold text-slate-800 truncate max-w-40 sm:max-w-64">
                                {actorName}
                            </span>

                            {/* Action category pill */}
                            <span
                                className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0",
                                    config.badgeBg,
                                    config.badgeText
                                )}
                            >
                                {config.label}
                            </span>
                        </div>

                        {/* Timestamp */}
                        <div
                            className="text-[11px] text-slate-400 shrink-0 font-medium cursor-default"
                            title={absoluteTime}
                        >
                            {relativeTime}
                        </div>
                    </div>

                    {/* Main Sentence Description */}
                    <div className="text-xs sm:text-sm text-slate-600 leading-relaxed break-words">
                        {renderActionDescription()}
                    </div>

                    {/* Bottom Metadata & Expand Toggle */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                        <div className="flex flex-wrap items-center gap-2">
                            {/* IP Address badge (Only populated for Owner/Admin) */}
                            {activity.ipAddress && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px]">
                                    <Globe className="w-3 h-3 text-slate-400" />
                                    {activity.ipAddress}
                                </span>
                            )}

                            {/* Project tag if available */}
                            {proj?.name && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium">
                                    Project: {proj.name}
                                </span>
                            )}
                        </div>

                        {/* Expand Details button */}
                        {hasExtraDetails && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-primary transition-colors cursor-pointer ml-auto"
                            >
                                <span>{isExpanded ? "Hide Details" : "View Details"}</span>
                                {isExpanded ? (
                                    <ChevronUp className="w-3 h-3" />
                                ) : (
                                    <ChevronDown className="w-3 h-3" />
                                )}
                            </button>
                        )}
                    </div>

                    {/* Collapsible Metadata Drawer */}
                    {isExpanded && hasExtraDetails && (
                        <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 font-mono text-[11px] text-slate-700 overflow-x-auto">
                            <div className="text-[10px] font-sans font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                                Audit Event Payload & Context
                            </div>
                            <pre className="text-[11px] leading-tight text-slate-800 whitespace-pre-wrap">
                                {JSON.stringify(activity.details, null, 2)}
                            </pre>
                            {activity.userAgent && (
                                <div className="mt-2 pt-2 border-t border-slate-200/60 font-sans text-[10px] text-slate-400 truncate">
                                    Client: {activity.userAgent}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityTimelineItem;
