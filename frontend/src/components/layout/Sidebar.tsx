"use client";

import React, { useState, useEffect } from "react";
import { LayoutDashboard, Folder, FileText, UploadCloud, ClipboardCheck, Download, BarChart2, Settings, CircleHelp, Plus, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "../ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ProjectForm from "../../features/projects/components/ProjectForm";

interface SidebarProps {
    children?: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = () => {
    const pathname = usePathname();
    const pathName = pathname.split("/")[1];
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isTablet, setIsTablet] = useState(false);
    const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

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

    return (
        <div className={`hidden xs:flex h-screen bg-surface ${isCollapsed ? 'p-1.5' : "px-2.5 py-1.5"} flex-col sticky top-0 transition-all duration-300 z-40 shrink-0 ${isCollapsed ? "w-14" : "w-[20%] max-w-56 min-w-48"}`}>
            <div className={`mb-md flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary font-bold text-on-primary">
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

            <Button
                className={`bg-primary !text-white hover:!text-white mb-md font-label-md hover:bg-primary-container transition-colors shrink-0 ${isCollapsed ? "w-9 h-9 rounded-sm p-0 mx-auto flex items-center justify-center" : "w-full rounded-md py-2 px-4 text-label-md"}`}
                title={isCollapsed ? "New Project" : undefined}
                onClick={() => setIsProjectFormOpen(true)}
            >
                {isCollapsed ? <Plus className="h-5 w-5" /> : "New Project"}
            </Button>

            <div className="flex h-full w-full flex-col items-start justify-between">
                {/* Top Navigation */}
                <nav className="space-y-0.5 w-full flex flex-col items-center">
                    <NavItem icon={<LayoutDashboard />} label="Dashboard" isActive={pathName === 'dashboard'} path='/dashboard' isCollapsed={isCollapsed} />
                    <NavItem icon={<Folder />} label="Projects" isActive={pathName === 'project'} path='/project' isCollapsed={isCollapsed} />
                    <NavItem icon={<FileText />} label="Documents" isCollapsed={isCollapsed} />
                    <NavItem icon={<UploadCloud />} label="Upload" isCollapsed={isCollapsed} />
                    <NavItem icon={<ClipboardCheck />} label="Verification" isCollapsed={isCollapsed} />
                    <NavItem icon={<Download />} label="Exports" isCollapsed={isCollapsed} />
                    <NavItem icon={<BarChart2 />} label="Analytics" isCollapsed={isCollapsed} />
                </nav>

                {/* Bottom Navigation */}
                <div className="mt-auto space-y-0.5 border-t border-border-subtle pt-1 w-full flex flex-col items-center">
                    <NavItem icon={<Settings />} label="Settings" isCollapsed={isCollapsed} />
                    <NavItem icon={<CircleHelp />} label="Support" isCollapsed={isCollapsed} />

                    {/* Collapse/Expand toggle — only on desktop (>768px) */}
                    {!isTablet && (
                        <button
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className={`group w-full flex items-center rounded-md font-label-md text-label-md text-secondary transition-colors duration-200 hover:bg-surface-container-low hover:text-primary mt-1 ${isCollapsed ? "justify-center px-0 py-1.5" : "gap-3 px-2 py-1.5"}`}
                            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            {isCollapsed ? <PanelLeftOpen className="h-4 w-4 shrink-0" /> : <><PanelLeftClose className="h-4 w-4 shrink-0" /><span className="truncate">Collapse</span></>}
                        </button>
                    )}

                    {/* User Profile */}
                    <div className={`mt-1 flex items-center gap-3 py-1.5 bg-surface-container-lowest w-full rounded-md ${isCollapsed ? "justify-center px-0" : "px-2"}`}>
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-secondary-container">
                            <img
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuASdH4naDqi6HA53auxaqJXVZoJzasRHECb8CtGBK1hhn3BSC8ugLJDBcE3XAKEpV5sPfXhmebCDDT3kkyPOdtqfM1tWpn7TCsQ71kVCkfFwWWVni7terzmRiriisqL6evXO3cPdpuU3Y-WF9Aeq3EoExLFpDO_bp4uKwbKkwJ7g2NxsmHonnfpE-6dZYSB0FngfQAm38qnTVsMLVt69olPALjhhjM_F1Q6LzB3Z6kgPx0VJHwj5um7"
                                alt="User Profile Avatar"
                                className="h-full w-full object-cover"
                            />
                        </div>

                        {!isCollapsed && (
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-label-md text-label-md text-text-primary">
                                    Alex Mercer
                                </p>
                                <p className="truncate text-[10px] text-secondary">
                                    alex@structurflow.io
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

const NavItem = ({ icon, label, isActive = false, path = '#', isCollapsed }: { icon: React.ReactNode, label: string, isActive?: boolean, path?: string, isCollapsed: boolean }) => {
    return (
        <Link
            href={path}
            title={isCollapsed ? label : undefined}
            className={`group w-full flex items-center rounded-md font-label-md text-label-md transition-colors duration-200 ${isCollapsed ? "justify-center px-0 py-2" : "gap-3 px-2 py-1.5"} ${isActive ? "bg-surface-container-low text-primary font-bold" : "text-secondary hover:bg-surface-container-low hover:text-primary"}`}
        >
            <div className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">
                {icon}
            </div>
            {!isCollapsed && <span className="truncate">{label}</span>}
        </Link>
    )
}

export default Sidebar;
