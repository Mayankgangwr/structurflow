"use client";

import React, { useState } from "react";
import { Plus, LayoutDashboard, Folder, ClipboardCheck, FileText } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ProjectForm from "../../features/projects/components/ProjectForm";
import { useGetProjectsQuery } from "@/features/projects/projectApi";

const MobileBottomNav: React.FC = () => {
    const pathname = usePathname() || "";
    const currentSection = pathname.split("/")[1] || "dashboard";
    const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

    const { data: projectsData } = useGetProjectsQuery();
    const pendingVerificationCount = projectsData?.data?.meta?.totalPendingVerification ?? 0;

    return (
        <>
            <nav className="fixed bottom-0 w-full z-50 xs:hidden border-t border-border-subtle bg-surface/95 backdrop-blur-md shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-safe">
                {/* FAB Upload / New Project Button centered above nav */}
                <div className="absolute left-1/2 -top-6 transform -translate-x-1/2 z-50">
                    <button
                        onClick={() => setIsProjectFormOpen(true)}
                        title="New Project"
                        className="bg-primary text-white w-13 h-13 rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all active:scale-95 ring-4 ring-surface"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex justify-around items-center h-15 px-2">
                    {/* Dashboard */}
                    <Link
                        href="/dashboard"
                        className={`flex flex-col items-center justify-center transition-colors w-16 h-full pt-1 ${
                            currentSection === 'dashboard'
                                ? 'text-primary font-bold'
                                : 'text-secondary hover:text-text-primary'
                        }`}
                    >
                        <LayoutDashboard className="w-5 h-5 mb-0.5" />
                        <span className="font-label-sm text-[10px]">Home</span>
                    </Link>

                    {/* Projects */}
                    <Link
                        href="/project"
                        className={`flex flex-col items-center justify-center transition-colors w-16 h-full pt-1 ${
                            currentSection === 'project'
                                ? 'text-primary font-bold'
                                : 'text-secondary hover:text-text-primary'
                        }`}
                    >
                        <Folder className="w-5 h-5 mb-0.5" />
                        <span className="font-label-sm text-[10px]">Projects</span>
                    </Link>

                    {/* Spacer for FAB */}
                    <div className="w-12"></div>

                    {/* Verify */}
                    <Link
                        href="/verification"
                        className={`flex flex-col items-center justify-center transition-colors w-16 h-full pt-1 relative ${
                            currentSection === 'verification'
                                ? 'text-primary font-bold'
                                : 'text-secondary hover:text-text-primary'
                        }`}
                    >
                        <div className="relative">
                            <ClipboardCheck className="w-5 h-5 mb-0.5" />
                            {pendingVerificationCount > 0 && (
                                <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-surface animate-pulse" />
                            )}
                        </div>
                        <span className="font-label-sm text-[10px]">Verify</span>
                    </Link>

                    {/* Documents */}
                    <Link
                        href="/documents"
                        className={`flex flex-col items-center justify-center transition-colors w-16 h-full pt-1 ${
                            currentSection === 'documents'
                                ? 'text-primary font-bold'
                                : 'text-secondary hover:text-text-primary'
                        }`}
                    >
                        <FileText className="w-5 h-5 mb-0.5" />
                        <span className="font-label-sm text-[10px]">Docs</span>
                    </Link>
                </div>
            </nav>

            <ProjectForm isOpen={isProjectFormOpen} onClose={() => setIsProjectFormOpen(false)} />
        </>
    );
};

export default MobileBottomNav;