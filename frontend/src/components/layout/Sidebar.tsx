"use client";

import React, { useState, useEffect } from "react";
import {
    LayoutDashboard,
    Folder,
    ClipboardCheck,
    FileText,
    BarChart2,
    History,
    Users,
    Settings,
    CircleHelp,
    Plus,
    PanelLeftClose,
    PanelLeftOpen
} from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ProjectForm from "../../features/projects/components/ProjectForm";
import { useAppSelector } from "@/store/hooks";
import { useGetProjectsQuery } from "@/features/projects/projectApi";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { cn } from "@/lib/utils";

interface SidebarProps {
    children?: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = () => {
    const pathname = usePathname() || "";
    const currentSection = pathname.split("/")[1] || "dashboard";
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

    const { role, can } = usePermissions();
    const user = useAppSelector((state) => state.auth.user);
    const { data: projectsData } = useGetProjectsQuery();

    // Live global count of documents requiring verification across all projects
    const pendingVerificationCount = projectsData?.data?.meta?.totalPendingVerification ?? 0;

    useEffect(() => {
        const getMode = (width: number) => {
            if (width > 768) return "desktop";
            if (width > 450) return "tablet";
            return "mobile";
        };

        let prevMode = getMode(window.innerWidth);

        // Initialize state on mount
        if (prevMode === "tablet") {
            setIsCollapsed(true);
            setIsTablet(true);
        } else if (prevMode === "mobile") {
            setIsCollapsed(true);
            setIsTablet(false);
        } else {
            setIsCollapsed(false);
            setIsTablet(false);
        }

        const handleResize = () => {
            const currentMode = getMode(window.innerWidth);
            if (currentMode !== prevMode) {
                prevMode = currentMode;
                if (currentMode === "desktop") {
                    setIsCollapsed(false);
                    setIsTablet(false);
                } else if (currentMode === "tablet") {
                    setIsCollapsed(true);
                    setIsTablet(true);
                }
                // mobile: sidebar is hidden via CSS, no state change needed
            }
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const fullName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : "Workspace User";
    const email = user?.email || "user@structurflow.io";
    const initials = user?.firstName
        ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ''}`.toUpperCase()
        : "S";

    return (
        <div className={`hidden xs:flex h-screen bg-surface ${isCollapsed ? 'p-1.5' : "px-2.5 py-1.5"} flex-col sticky top-0 transition-all duration-300 z-40 shrink-0 ${isCollapsed ? "w-14" : "w-[20%] max-w-56 min-w-48"}`}>
            {/* App Brand Header */}
            <div className={`mb-md flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary font-bold text-on-primary shadow-sm">
                    S
                </div>

                {!isCollapsed && (
                    <div className="min-w-0">
                        <h1 className="font-headline-md text-base font-bold leading-tight text-primary truncate">
                            StructurFlow
                        </h1>
                        <p className="font-label-sm text-[11px] leading-tight text-secondary truncate">
                            Enterprise Workspace
                        </p>
                    </div>
                )}
            </div>

            {/* New Project Action Button (gated for OWNER / ADMIN) */}
            {can("create_project") && (
                <Button
                    className={`bg-primary text-white! hover:text-white! mb-md font-label-md hover:bg-primary-container transition-colors shrink-0 ${isCollapsed ? "w-9 h-9 rounded-sm p-0 mx-auto flex items-center justify-center" : "w-full rounded-md py-2 px-4 text-label-md"}`}
                    title={isCollapsed ? "New Project" : undefined}
                    onClick={() => setIsProjectFormOpen(true)}
                >
                    {isCollapsed ? <Plus className="h-5 w-5" /> : "New Project"}
                </Button>
            )}

            {/* Nav Menu Content */}
            <div className="flex h-full w-full flex-col items-start justify-between overflow-y-auto no-scrollbar">
                <div className="w-full flex flex-col items-center space-y-3">
                    {/* Core Workflows */}
                    <nav className="space-y-0.5 w-full flex flex-col items-center">
                        {!isCollapsed && (
                            <div className="w-full px-2 pb-1 text-[10px] font-bold tracking-wider text-secondary/70 uppercase">
                                Workflows
                            </div>
                        )}
                        <NavItem
                            icon={<LayoutDashboard />}
                            label="Dashboard"
                            isActive={currentSection === 'dashboard'}
                            path='/dashboard'
                            isCollapsed={isCollapsed}
                        />
                        <NavItem
                            icon={<Folder />}
                            label="Projects"
                            isActive={currentSection === 'project'}
                            path='/project'
                            isCollapsed={isCollapsed}
                        />
                        <NavItem
                            icon={<ClipboardCheck />}
                            label="Verification"
                            isActive={currentSection === 'verification'}
                            path='/verification'
                            isCollapsed={isCollapsed}
                            badge={pendingVerificationCount > 0 ? pendingVerificationCount : undefined}
                            badgeVariant="warning"
                        />
                        <NavItem
                            icon={<FileText />}
                            label="Documents"
                            isActive={currentSection === 'documents'}
                            path='/documents'
                            isCollapsed={isCollapsed}
                        />
                    </nav>

                    {/* Insights & Operations */}
                    <nav className="space-y-0.5 w-full flex flex-col items-center pt-2 border-t border-border-subtle/60">
                        {!isCollapsed && (
                            <div className="w-full px-2 pb-1 text-[10px] font-bold tracking-wider text-secondary/70 uppercase">
                                Operations
                            </div>
                        )}
                        <NavItem
                            icon={<BarChart2 />}
                            label="Analytics"
                            isActive={currentSection === 'analytics'}
                            path='/analytics'
                            isCollapsed={isCollapsed}
                        />
                        <NavItem
                            icon={<History />}
                            label="Activity Log"
                            isActive={currentSection === 'activity'}
                            path='/activity'
                            isCollapsed={isCollapsed}
                        />
                        <NavItem
                            icon={<Users />}
                            label="Team"
                            isActive={currentSection === 'team'}
                            path='/team'
                            isCollapsed={isCollapsed}
                        />
                    </nav>
                </div>

                {/* Bottom Navigation */}
                <div className="mt-auto space-y-0.5 border-t border-border-subtle pt-1 w-full flex flex-col items-center">
                    <NavItem
                        icon={<Settings />}
                        label="Settings"
                        isActive={currentSection === 'settings'}
                        path='/settings'
                        isCollapsed={isCollapsed}
                    />
                    <NavItem
                        icon={<CircleHelp />}
                        label="Support"
                        isActive={currentSection === 'support'}
                        path='/support'
                        isCollapsed={isCollapsed}
                    />

                    {/* Collapse/Expand toggle — only on desktop (>768px) */}
                    {!isTablet && (
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={`group w-full flex items-center rounded-md font-label-md text-label-md text-secondary transition-colors duration-200 hover:bg-surface-container-low hover:text-primary mt-1 ${isCollapsed ? "justify-center px-0 py-1.5" : "gap-3 px-2 py-1.5"}`}
                            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            {isCollapsed ? (
                                <PanelLeftOpen className="h-4 w-4 shrink-0" />
                            ) : (
                                <>
                                    <PanelLeftClose className="h-4 w-4 shrink-0" />
                                    <span className="truncate">Collapse</span>
                                </>
                            )}
                        </button>
                    )}

                    {/* User Profile */}
                    <div className={`mt-1 flex items-center gap-2.5 py-1.5 bg-surface-container-lowest w-full rounded-md ${isCollapsed ? "justify-center px-0" : "px-2"}`}>
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs border border-primary/20">
                            {initials}
                        </div>

                        {!isCollapsed && (
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                    <p className="truncate font-label-md text-xs font-semibold text-text-primary">
                                        {fullName}
                                    </p>
                                    {role && (
                                        <span className={cn(
                                            "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border shrink-0",
                                            role === "OWNER" && "bg-amber-50 text-amber-700 border-amber-200",
                                            role === "ADMIN" && "bg-blue-50 text-blue-700 border-blue-200",
                                            role === "REVIEWER" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                            role === "VIEWER" && "bg-slate-50 text-slate-600 border-slate-200"
                                        )}>
                                            {role}
                                        </span>
                                    )}
                                </div>
                                <p className="truncate text-[10px] text-secondary">
                                    {email}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <ProjectForm isOpen={isProjectFormOpen} onClose={() => setIsProjectFormOpen(false)} />
        </div>
    );
};

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
    path?: string;
    isCollapsed: boolean;
    badge?: number | string;
    badgeVariant?: 'warning' | 'primary' | 'neutral';
}

const NavItem: React.FC<NavItemProps> = ({
    icon,
    label,
    isActive = false,
    path = '#',
    isCollapsed,
    badge,
    badgeVariant = 'primary'
}) => {
    return (
        <Link
            href={path}
            title={isCollapsed ? label : undefined}
            className={`group w-full flex items-center rounded-md font-label-md text-label-md transition-colors duration-200 relative ${isCollapsed ? "justify-center px-0 py-2" : "gap-3 px-2 py-1.5"} ${isActive ? "bg-surface-container-low text-primary font-bold" : "text-secondary hover:bg-surface-container-low hover:text-primary"}`}
        >
            <div className="shrink-0 relative [&>svg]:h-4 [&>svg]:w-4">
                {icon}
                {isCollapsed && badge !== undefined && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-surface animate-pulse" />
                )}
            </div>

            {!isCollapsed && (
                <>
                    <span className="truncate flex-1">{label}</span>
                    {badge !== undefined && (
                        <span className={`ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
                            badgeVariant === 'warning'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : 'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                            {badge}
                        </span>
                    )}
                </>
            )}
        </Link>
    );
};

export default Sidebar;
