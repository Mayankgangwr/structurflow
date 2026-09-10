"use client";

import React, { useMemo } from "react";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import {
    Shield,
    Upload,
    ClipboardCheck,
    FolderPlus,
    Sparkles,
    RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface DashboardWelcomeHeaderProps {
    pendingVerificationCount: number;
    organizationName?: string;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

const DashboardWelcomeHeader: React.FC<DashboardWelcomeHeaderProps> = ({
    pendingVerificationCount,
    organizationName,
    onRefresh,
    isRefreshing = false,
}) => {
    const { user, role, can, isOwner, isAdmin } = usePermissions();

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 17) return "Good afternoon";
        return "Good evening";
    }, []);

    const displayName = user?.firstName || user?.email?.split("@")[0] || "there";

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 sm:p-6 rounded-2xl text-white shadow-sm relative overflow-hidden">
            {/* Background Decorative Glow */}
            <div className="absolute right-0 top-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

            <div className="relative z-10 flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-indigo-200 border border-white/10 backdrop-blur-xs">
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        Mission Control
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                        <Shield className="w-3 h-3 text-indigo-300" />
                        {role || "VIEWER"}
                    </span>
                    {organizationName && (
                        <span className="text-xs text-slate-400 font-medium">
                            • {organizationName}
                        </span>
                    )}
                </div>

                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white">
                    {greeting}, {displayName}.
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 max-w-full leading-relaxed">
                    {pendingVerificationCount > 0 ? (
                        <span>
                            You have{" "}
                            <span className="font-semibold text-amber-300">
                                {pendingVerificationCount} {pendingVerificationCount === 1 ? "document" : "documents"}
                            </span>{" "}
                            awaiting human verification review in your workspace pipeline.
                        </span>
                    ) : (
                        "All pipeline documents have been processed. Your workspace backlog is clear."
                    )}
                </p>
            </div>

            {/* Quick Action CTAs */}
            <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0 self-start md:self-auto">
                {pendingVerificationCount > 0 && can("verify_documents") && (
                    <Link href="/verification">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs sm:text-sm gap-2 shadow-md py-2 px-4 cursor-pointer">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-950" />
                            </span>
                            <ClipboardCheck className="w-4 h-4 text-slate-950" />
                            <span>Review Queue ({pendingVerificationCount})</span>
                        </Button>
                    </Link>
                )}

                {can("upload_documents") && (
                    <Link href="/documents">
                        <Button
                            variant="outline"
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs sm:text-sm font-semibold gap-1.5 py-2 px-3.5 cursor-pointer backdrop-blur-xs"
                        >
                            <Upload className="w-3.5 h-3.5 text-indigo-300" />
                            <span>Upload Documents</span>
                        </Button>
                    </Link>
                )}

                {(isOwner || isAdmin || can("create_project")) && (
                    <Link href="/project">
                        <Button
                            variant="outline"
                            className="bg-white/5 hover:bg-white/15 text-slate-200 border-white/10 text-xs sm:text-sm font-semibold gap-1.5 py-2 px-3 cursor-pointer hidden lg:inline-flex"
                        >
                            <FolderPlus className="w-3.5 h-3.5 text-slate-400" />
                            <span>Projects</span>
                        </Button>
                    </Link>
                )}

                {onRefresh && (
                    <Button
                        variant="outline"
                        onClick={onRefresh}
                        disabled={isRefreshing}
                        className="bg-white/5 hover:bg-white/15 text-slate-200 border-white/10 text-xs sm:text-sm font-medium gap-1.5 py-2 px-3 cursor-pointer transition-all"
                        title="Sync live dashboard metrics"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 text-indigo-300 ${isRefreshing ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">{isRefreshing ? "Syncing..." : "Sync"}</span>
                    </Button>
                )}
            </div>
        </div>
    );
};

export default DashboardWelcomeHeader;
