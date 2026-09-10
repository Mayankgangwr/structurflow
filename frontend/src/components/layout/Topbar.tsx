"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Search,
    Bell,
    Network,
    Plus,
    FileUp,
    CheckCircle2,
    XCircle,
    Cpu,
    UserPlus,
    FolderPlus,
    Activity,
    ArrowRight,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn, getPageDetails } from "@/lib/utils";
import { Button } from "../ui/button";
import ProjectForm from "@/features/projects/components/ProjectForm";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { useAppSelector } from "@/store/hooks";
import { useGetActivitiesQuery, AuditAction } from "@/features/activity/activityApi";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import GlobalSearchBar from "./GlobalSearchBar";

const Topbar: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname() || "";
    const { title, description } = getPageDetails(pathname);
    const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isMobileNotificationsOpen, setIsMobileNotificationsOpen] = useState(false);
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

    const desktopDropdownRef = useRef<HTMLDivElement>(null);
    const mobileDropdownRef = useRef<HTMLDivElement>(null);

    const { can } = usePermissions();
    const user = useAppSelector((state) => state.auth.user);
    const { data: activityData, isLoading: isActivityLoading } = useGetActivitiesQuery({ limit: 5 });

    const activities = activityData?.data?.activities || [];

    // Initials matching Sidebar.tsx
    const fullName = user?.firstName
        ? `${user.firstName} ${user.lastName || ""}`.trim()
        : "Workspace User";
    const initials = user?.firstName
        ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ""}`.toUpperCase()
        : "S";

    // Close notifications on outside click or Esc
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
            if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
                setIsMobileNotificationsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setIsNotificationsOpen(false);
                setIsMobileNotificationsOpen(false);
                setIsMobileSearchOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

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

    const getTimeAgo = (dateStr?: string) => {
        if (!dateStr) return "just now";
        try {
            return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
        } catch {
            return "recently";
        }
    };

    const renderActivityDropdown = (isMobile: boolean) => (
        <div
            className={cn(
                "bg-surface border border-border-subtle rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150",
                isMobile
                    ? "fixed left-3 right-3 top-16 max-w-sm ml-auto"
                    : "absolute right-0 top-12 w-84 sm:w-96"
            )}
        >
            {/* Dropdown Header */}
            <div className="p-3.5 px-4 border-b border-border-subtle flex items-center justify-between bg-surface-container-lowest">
                <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <h3 className="font-label-md font-bold text-text-primary text-xs uppercase tracking-wider">
                        Recent Activity
                    </h3>
                    <span className="bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                        {activities.length}
                    </span>
                </div>
                <Link
                    href="/activity"
                    onClick={() => {
                        setIsNotificationsOpen(false);
                        setIsMobileNotificationsOpen(false);
                    }}
                    className="text-[11px] font-medium text-primary hover:underline"
                >
                    View all
                </Link>
            </div>

            {/* Dropdown Content */}
            <div className="max-h-80 overflow-y-auto divide-y divide-border-subtle/50">
                {isActivityLoading ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 animate-pulse">
                                <div className="w-7 h-7 rounded-full bg-surface-container-high shrink-0" />
                                <div className="flex-1 space-y-1.5">
                                    <div className="w-32 h-2.5 bg-surface-container-high rounded" />
                                    <div className="w-48 h-2 bg-surface-container rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : activities.length === 0 ? (
                    <div className="py-8 px-4 text-center">
                        <Activity className="w-8 h-8 text-secondary/40 mx-auto mb-2" />
                        <p className="text-xs text-secondary font-medium">No recent system activity</p>
                    </div>
                ) : (
                    activities.map((act) => {
                        const { icon: ActionIcon, color, label } = getActionDisplay(act.action);
                        const docName = act.documentId?.originalFileName;
                        const projectName = act.projectId?.name;
                        const actorName = act.actorId
                            ? `${act.actorId.firstName || ""} ${act.actorId.lastName || ""}`.trim() ||
                              act.actorId.email ||
                              "System"
                            : "System Automated";
                        const timeAgo = getTimeAgo(act.createdAt);

                        return (
                            <div
                                key={act._id}
                                onClick={() => {
                                    setIsNotificationsOpen(false);
                                    setIsMobileNotificationsOpen(false);
                                    if (act.projectId?._id) {
                                        router.push(`/project/${act.projectId._id}`);
                                    } else if (act.documentId?._id) {
                                        router.push(`/documents`);
                                    } else {
                                        router.push(`/activity`);
                                    }
                                }}
                                className="p-3 px-4 hover:bg-surface-container-low transition-colors cursor-pointer flex items-start gap-3 text-left group"
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
                                        <p className="text-xs font-semibold text-text-primary truncate group-hover:text-primary transition-colors">
                                            {label}
                                        </p>
                                        <span className="text-[10px] text-secondary whitespace-nowrap">
                                            {timeAgo}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-secondary truncate mt-0.5">
                                        <span className="font-medium text-text-primary/80">{actorName}</span>
                                        {docName ? (
                                            <span>
                                                {" "}• <span className="font-medium text-text-primary/90">{docName}</span>
                                            </span>
                                        ) : projectName ? (
                                            <span>
                                                {" "}in <span className="font-medium text-text-primary/90">{projectName}</span>
                                            </span>
                                        ) : null}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Dropdown Footer */}
            <div className="p-2.5 px-4 bg-surface-container-lowest border-t border-border-subtle flex items-center justify-between">
                <span className="text-[11px] text-secondary">Showing recent events</span>
                <Link
                    href="/activity"
                    onClick={() => {
                        setIsNotificationsOpen(false);
                        setIsMobileNotificationsOpen(false);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                >
                    <span>Full Audit Log</span>
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop/Tablet Topbar - visible at ≥450px */}
            <header className="hidden xs:flex justify-between items-center h-13 px-4 w-full bg-surface sticky top-0 z-30 shrink-0 border-b border-border-subtle/40">
                <div className="flex-1 min-w-0 mr-4">
                    <h2 className="font-headline-md text-base font-bold text-text-primary truncate">{title}</h2>
                    <p className="text-label-sm font-label-sm text-secondary truncate">{description}</p>
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Omnisearch Bar - responsive across tablet and desktop */}
                    <div className="w-44 sm:w-60 md:w-72 lg:w-80">
                        <GlobalSearchBar />
                    </div>

                    {/* Notification Bell with Dropdown */}
                    <div className="relative" ref={desktopDropdownRef}>
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className={cn(
                                "w-9 h-9 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container-low transition-colors relative cursor-pointer",
                                isNotificationsOpen && "bg-surface-container-low text-primary"
                            )}
                            title="Notifications & System Activity"
                        >
                            <Bell className="w-4 h-4" />
                            {activities.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-surface animate-pulse" />
                            )}
                        </button>
                        {isNotificationsOpen && renderActivityDropdown(false)}
                    </div>

                    {/* New Project CTA */}
                    {can("create_project") && (
                        <Button
                            className="bg-primary text-white! hover:text-white! mb-0 font-label-md hover:bg-primary-container transition-colors shrink-0 rounded-md py-2 px-3 sm:px-4 text-xs sm:text-label-md cursor-pointer"
                            title="New Project"
                            onClick={() => setIsProjectFormOpen(true)}
                        >
                            <span className="hidden sm:inline">New Project</span>
                            <span className="sm:hidden">New</span>
                        </Button>
                    )}
                </div>
            </header>
            <ProjectForm isOpen={isProjectFormOpen} onClose={() => setIsProjectFormOpen(false)} />

            {/* Mobile Topbar - visible below 450px */}
            <div className="h-16 w-full xs:hidden shrink-0" />
            <header className="fixed top-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border-subtle h-16 flex justify-between items-center px-4 w-full xs:hidden shrink-0">
                <div className="flex items-center gap-2">
                    <Network className="text-primary w-6 h-6" />
                    <span className="font-headline-md text-headline-md font-bold text-primary">StructurFlow</span>
                </div>
                <div className="flex items-center gap-2.5">
                    {/* Mobile Search Toggle */}
                    <button
                        onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                        className={cn(
                            "p-2 rounded-full hover:bg-surface-container-low transition-colors text-secondary cursor-pointer",
                            isMobileSearchOpen && "text-primary bg-surface-container-low"
                        )}
                        title="Search Workspace"
                    >
                        <Search className="w-4 h-4" />
                    </button>

                    {/* Mobile Notification Bell */}
                    <div className="relative" ref={mobileDropdownRef}>
                        <button
                            onClick={() => setIsMobileNotificationsOpen(!isMobileNotificationsOpen)}
                            className={cn(
                                "relative p-2 rounded-full hover:bg-surface-container-low transition-colors text-secondary cursor-pointer",
                                isMobileNotificationsOpen && "text-primary bg-surface-container-low"
                            )}
                            title="Notifications & Activity"
                        >
                            <Bell className="w-4 h-4" />
                            {activities.length > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full ring-2 ring-surface animate-pulse" />
                            )}
                        </button>
                        {isMobileNotificationsOpen && renderActivityDropdown(true)}
                    </div>

                    {/* Dynamic Initials Avatar matching Sidebar */}
                    <Link
                        href="/settings"
                        className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 hover:bg-primary/20 transition-colors"
                        title={`${fullName} Profile Settings`}
                    >
                        {initials}
                    </Link>
                </div>
            </header>

            {/* Mobile Expandable Search Bar */}
            {isMobileSearchOpen && (
                <div className="fixed top-16 left-0 right-0 z-30 bg-surface border-b border-border-subtle p-2.5 px-4 xs:hidden animate-in slide-in-from-top-2 duration-150">
                    <GlobalSearchBar isMobile onCloseMobile={() => setIsMobileSearchOpen(false)} />
                </div>
            )}
        </>
    );
};

export default Topbar;