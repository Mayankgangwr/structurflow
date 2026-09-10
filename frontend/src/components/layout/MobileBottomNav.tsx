"use client";

import React, { useState, useEffect } from "react";
import {
    Plus,
    LayoutDashboard,
    Folder,
    ClipboardCheck,
    FileText,
    MoreHorizontal,
    BarChart2,
    History,
    Users,
    Settings,
    CircleHelp,
    X,
    ChevronRight,
    ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ProjectForm from "../../features/projects/components/ProjectForm";
import { useGetProjectsQuery } from "@/features/projects/projectApi";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { useAppSelector } from "@/store/hooks";
import { cn } from "@/lib/utils";

const MobileBottomNav: React.FC = () => {
    const pathname = usePathname() || "";
    const currentSection = pathname.split("/")[1] || "dashboard";
    const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
    const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

    const { role, can } = usePermissions();
    const canCreateProject = can("create_project");
    const user = useAppSelector((state) => state.auth.user);

    const { data: projectsData } = useGetProjectsQuery();
    const pendingVerificationCount = projectsData?.data?.meta?.totalPendingVerification ?? 0;

    // Close drawer whenever route changes
    useEffect(() => {
        setIsMoreDrawerOpen(false);
    }, [pathname]);

    // Handle Escape key to close drawer
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isMoreDrawerOpen) {
                setIsMoreDrawerOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isMoreDrawerOpen]);

    const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Workspace User";
    const email = user?.email || "";
    const initials = user?.firstName
        ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ""}`.toUpperCase()
        : "S";

    const isMoreActive = ["analytics", "activity", "team", "settings", "support"].includes(currentSection);

    return (
        <>
            <nav className="fixed bottom-0 w-full z-40 xs:hidden border-t border-border-subtle bg-surface/95 backdrop-blur-md shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-safe">
                {/* FAB Upload / New Project Button centered above nav (gated for OWNER / ADMIN) */}
                {canCreateProject && (
                    <div className="absolute left-1/2 -top-5 transform -translate-x-1/2 z-40">
                        <button
                            onClick={() => setIsProjectFormOpen(true)}
                            title="New Project"
                            className="bg-primary text-white w-11 h-11 rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95 ring-3 ring-surface"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-5 items-center h-14 px-1">
                    {/* 1. Dashboard */}
                    <Link
                        href="/dashboard"
                        className={cn(
                            "flex flex-col items-center justify-center transition-colors h-full pt-1",
                            currentSection === "dashboard"
                                ? "text-primary font-bold"
                                : "text-secondary hover:text-text-primary"
                        )}
                    >
                        <LayoutDashboard className="w-4.5 h-4.5 mb-0.5" />
                        <span className="font-label-sm text-[10px]">Home</span>
                    </Link>

                    {/* 2. Projects */}
                    <Link
                        href="/project"
                        className={cn(
                            "flex flex-col items-center justify-center transition-colors h-full pt-1",
                            currentSection === "project"
                                ? "text-primary font-bold"
                                : "text-secondary hover:text-text-primary"
                        )}
                    >
                        <Folder className="w-4.5 h-4.5 mb-0.5" />
                        <span className="font-label-sm text-[10px]">Projects</span>
                    </Link>

                    {/* 3. Verify */}
                    <Link
                        href="/verification"
                        className={cn(
                            "flex flex-col items-center justify-center transition-colors h-full pt-1 relative",
                            currentSection === "verification"
                                ? "text-primary font-bold"
                                : "text-secondary hover:text-text-primary"
                        )}
                    >
                        <div className="relative">
                            <ClipboardCheck className="w-4.5 h-4.5 mb-0.5" />
                            {pendingVerificationCount > 0 && (
                                <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-surface animate-pulse" />
                            )}
                        </div>
                        <span className="font-label-sm text-[10px]">Verify</span>
                    </Link>

                    {/* 4. Documents */}
                    <Link
                        href="/documents"
                        className={cn(
                            "flex flex-col items-center justify-center transition-colors h-full pt-1",
                            currentSection === "documents"
                                ? "text-primary font-bold"
                                : "text-secondary hover:text-text-primary"
                        )}
                    >
                        <FileText className="w-4.5 h-4.5 mb-0.5" />
                        <span className="font-label-sm text-[10px]">Docs</span>
                    </Link>

                    {/* 5. More Operations Drawer Trigger */}
                    <button
                        onClick={() => setIsMoreDrawerOpen(true)}
                        className={cn(
                            "flex flex-col items-center justify-center transition-colors h-full pt-1 cursor-pointer",
                            isMoreActive || isMoreDrawerOpen
                                ? "text-primary font-bold"
                                : "text-secondary hover:text-text-primary"
                        )}
                    >
                        <MoreHorizontal className="w-4.5 h-4.5 mb-0.5" />
                        <span className="font-label-sm text-[10px]">More</span>
                    </button>
                </div>
            </nav>

            {/* Mobile Bottom Sheet Drawer ("More Operations") */}
            {isMoreDrawerOpen && (
                <div className="fixed inset-0 z-50 xs:hidden">
                    {/* Blurred Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
                        onClick={() => setIsMoreDrawerOpen(false)}
                    />

                    {/* Slide-Up Bottom Drawer Sheet */}
                    <div className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-3xl shadow-2xl flex flex-col z-50 overflow-hidden border-t border-slate-200 animate-slide-up pb-safe">
                        {/* Drag Pill Handle */}
                        <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-2.5 shrink-0" />

                        {/* Drawer Header */}
                        <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">More Operations</h3>
                                <p className="text-[11px] text-slate-400">Navigation & workspace management</p>
                            </div>
                            <button
                                onClick={() => setIsMoreDrawerOpen(false)}
                                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Navigation Options List */}
                        <div className="p-4 space-y-1.5 overflow-y-auto">
                            {/* Analytics */}
                            <Link
                                href="/analytics"
                                onClick={() => setIsMoreDrawerOpen(false)}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-xl transition-all",
                                    currentSection === "analytics"
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "hover:bg-slate-50 text-slate-700"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                                        <BarChart2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold leading-none">Analytics</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Throughput & team velocity</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300" />
                            </Link>

                            {/* Activity Log */}
                            <Link
                                href="/activity"
                                onClick={() => setIsMoreDrawerOpen(false)}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-xl transition-all",
                                    currentSection === "activity"
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "hover:bg-slate-50 text-slate-700"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                        <History className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold leading-none">Activity Log</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Audit trail & system events</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300" />
                            </Link>

                            {/* Team */}
                            <Link
                                href="/team"
                                onClick={() => setIsMoreDrawerOpen(false)}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-xl transition-all",
                                    currentSection === "team"
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "hover:bg-slate-50 text-slate-700"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold leading-none">Team & Permissions</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Manage members & invites</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300" />
                            </Link>

                            {/* Settings */}
                            <Link
                                href="/settings"
                                onClick={() => setIsMoreDrawerOpen(false)}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-xl transition-all",
                                    currentSection === "settings"
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "hover:bg-slate-50 text-slate-700"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                                        <Settings className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold leading-none">Settings</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Profile, organization & thresholds</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300" />
                            </Link>

                            {/* Support */}
                            <Link
                                href="/support"
                                onClick={() => setIsMoreDrawerOpen(false)}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-xl transition-all",
                                    currentSection === "support"
                                        ? "bg-primary/10 text-primary font-semibold"
                                        : "hover:bg-slate-50 text-slate-700"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                                        <CircleHelp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold leading-none">Help & Support</p>
                                        <p className="text-[11px] text-slate-400 mt-0.5">Documentation, status & tickets</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-slate-300" />
                            </Link>
                        </div>

                        {/* User Profile Card at Bottom of Drawer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20 shrink-0">
                                {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold text-slate-900 truncate">{fullName}</p>
                                    {role && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded uppercase">
                                            {role}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400 truncate">{email}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ProjectForm isOpen={isProjectFormOpen} onClose={() => setIsProjectFormOpen(false)} />
        </>
    );
};

export default MobileBottomNav;