"use client";

import React from "react";
import Link from "next/link";
import {
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
    FileText,
    Sparkles,
    ShieldCheck,
    Clock,
    FolderKanban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Document } from "@/features/documents/documentApi";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface DashboardAttentionCardProps {
    pendingDocument?: (Document & { projectId?: { _id: string; name: string } | string }) | null;
    pendingCount: number;
    isLoading?: boolean;
}

export const DashboardAttentionCard: React.FC<DashboardAttentionCardProps> = ({
    pendingDocument,
    pendingCount,
    isLoading,
}) => {
    const { can } = usePermissions();
    const canVerify = can("verify_documents");

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs animate-pulse">
                <div className="h-5 w-40 bg-slate-100 rounded mb-3" />
                <div className="h-16 bg-slate-100 rounded-lg mb-3" />
                <div className="h-9 w-full bg-slate-100 rounded" />
            </div>
        );
    }

    // Queue is clear state
    if (!pendingDocument || pendingCount === 0) {
        return (
            <div className="bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40 rounded-xl border border-emerald-200/80 p-5 shadow-xs relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-2xl pointer-events-none -mr-8 -mt-8" />
                
                <div className="relative z-10 flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 border border-emerald-200/80">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                All Systems Nominal
                            </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                            Human-in-the-Loop Queue Clear
                        </h3>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            No documents currently pending manual audit. Incoming documents will appear here automatically when confidence thresholds require human review.
                        </p>

                        <div className="mt-4 pt-3 border-t border-emerald-100/80 flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">Auto-pilot active</span>
                            <Link
                                href="/documents"
                                className="font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition-colors"
                            >
                                <span>Browse Archive</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Attention required state
    const docName =
        pendingDocument.originalFileName ||
        pendingDocument.originalFilename ||
        "Unnamed Document";

    const projectName =
        typeof pendingDocument.projectId === "object" && pendingDocument.projectId?.name
            ? pendingDocument.projectId.name
            : "General Project";

    const timeAgo = pendingDocument.createdAt
        ? formatDistanceToNow(new Date(pendingDocument.createdAt), { addSuffix: true })
        : "recently";

    const confidenceScore = pendingDocument.processingDetails?.confidenceScore
        ? Math.round(pendingDocument.processingDetails.confidenceScore * 100)
        : null;

    return (
        <div className="bg-gradient-to-br from-amber-50/70 via-white to-orange-50/40 rounded-xl border border-amber-200 shadow-xs p-5 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-36 h-36 bg-amber-200/30 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

            <div className="relative z-10 flex flex-col gap-3">
                {/* Header Badge */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                        </span>
                        <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                            Priority Review Queue
                        </span>
                    </div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        {pendingCount} Pending
                    </span>
                </div>

                {/* Document Item Highlight */}
                <div className="p-3 bg-white/90 border border-amber-200/80 rounded-lg shadow-2xs">
                    <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate" title={docName}>
                                {docName}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-slate-600 truncate max-w-[120px]">
                                    <FolderKanban className="w-3 h-3 text-slate-400" />
                                    {projectName}
                                </span>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-slate-500">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    {timeAgo}
                                </span>
                            </div>
                        </div>
                    </div>

                    {confidenceScore !== null && (
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500">Extraction Confidence:</span>
                            <span
                                className={cn(
                                    "font-bold px-1.5 py-0.2 rounded",
                                    confidenceScore >= 80
                                        ? "text-emerald-700 bg-emerald-50"
                                        : confidenceScore >= 60
                                        ? "text-amber-700 bg-amber-50"
                                        : "text-rose-700 bg-rose-50"
                                )}
                            >
                                {confidenceScore}%
                            </span>
                        </div>
                    )}
                </div>

                {/* Call to Action Button */}
                <Link href="/verification" className="w-full">
                    <Button
                        size="sm"
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>{canVerify ? "Start Human Audit Now" : "View Review Queue"}</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                </Link>
            </div>
        </div>
    );
};
