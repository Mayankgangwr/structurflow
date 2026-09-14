"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    UploadCloud,
    Cpu,
    AlertTriangle,
    CheckCircle2,
    ArrowRight,
    ArrowUpRight,
    DownloadCloud,
    Workflow,
    ShieldCheck,
    SlidersHorizontal,
    LayoutGrid,
    Flame,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface PipelineCounts {
    uploaded: number;
    processing: number;
    needsVerification: number;
    verified: number;
    exported: number;
}

interface DashboardPipelineFlowProps {
    counts: PipelineCounts;
    isLoading?: boolean;
}

export const DashboardPipelineFlow: React.FC<DashboardPipelineFlowProps> = ({
    counts,
    isLoading,
}) => {
    const [viewMode, setViewMode] = useState<"flow" | "grid">("flow");

    const totalPipeline =
        counts.uploaded +
        counts.processing +
        counts.needsVerification +
        counts.verified +
        counts.exported;

    const totalActive = counts.uploaded + counts.processing + counts.needsVerification;
    const accuracyRate =
        counts.verified + counts.needsVerification > 0
            ? Math.round((counts.verified / (counts.verified + counts.needsVerification)) * 100)
            : 100;

    const stages = [
        {
            id: "uploaded",
            step: "01",
            title: "Ingested",
            subtitle: "Raw document intake",
            count: counts.uploaded,
            icon: UploadCloud,
            iconBg: "bg-sky-50 text-sky-600 border-sky-200/80 group-hover:bg-sky-600 group-hover:text-white",
            borderHover: "hover:border-sky-300 hover:shadow-sky-500/10",
            barColor: "bg-sky-500",
            badgeText: counts.uploaded > 0 ? "Queued" : "Idle",
            badgeColor: "bg-sky-50 text-sky-700 border-sky-200",
            href: "/documents?status=UPLOADED",
            highlight: false,
        },
        {
            id: "processing",
            step: "02",
            title: "AI Extraction",
            subtitle: "Gemini Vision OCR",
            count: counts.processing,
            icon: Cpu,
            iconBg: "bg-purple-50 text-purple-600 border-purple-200/80 group-hover:bg-purple-600 group-hover:text-white",
            borderHover: "hover:border-purple-300 hover:shadow-purple-500/10",
            barColor: "bg-purple-500",
            badgeText: counts.processing > 0 ? "In OCR" : "Ready",
            badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
            href: "/documents?status=TRANSFORMED",
            highlight: false,
        },
        {
            id: "verification",
            step: "03",
            title: "Verification",
            subtitle: "Human-in-the-Loop review",
            count: counts.needsVerification,
            icon: AlertTriangle,
            iconBg:
                counts.needsVerification > 0
                    ? "bg-amber-100 text-amber-700 border-amber-300 group-hover:bg-amber-500 group-hover:text-white"
                    : "bg-amber-50 text-amber-600 border-amber-200/80 group-hover:bg-amber-500 group-hover:text-white",
            borderHover: "hover:border-amber-400 hover:shadow-amber-500/15",
            barColor: "bg-amber-500",
            badgeText: counts.needsVerification > 0 ? "Action Required" : "Clear",
            badgeColor:
                counts.needsVerification > 0
                    ? "bg-amber-100 text-amber-800 border-amber-300 font-bold animate-pulse"
                    : "bg-slate-50 text-slate-600 border-slate-200",
            href: "/verification",
            highlight: counts.needsVerification > 0,
        },
        {
            id: "verified",
            step: "04",
            title: "Verified",
            subtitle: "Audited & approved",
            count: counts.verified,
            icon: CheckCircle2,
            iconBg: "bg-emerald-50 text-emerald-600 border-emerald-200/80 group-hover:bg-emerald-600 group-hover:text-white",
            borderHover: "hover:border-emerald-300 hover:shadow-emerald-500/10",
            barColor: "bg-emerald-500",
            badgeText: counts.verified > 0 ? "Audited" : "0 Verified",
            badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
            href: "/documents?status=VERIFIED",
            highlight: false,
        },
        {
            id: "exported",
            step: "05",
            title: "Exported",
            subtitle: "Downstream synced",
            count: counts.exported,
            icon: DownloadCloud,
            iconBg: "bg-teal-50 text-teal-600 border-teal-200/80 group-hover:bg-teal-600 group-hover:text-white",
            borderHover: "hover:border-teal-300 hover:shadow-teal-500/10",
            barColor: "bg-teal-500",
            badgeText: counts.exported > 0 ? "Synced" : "0 Synced",
            badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
            href: "/documents?status=EXPORTED",
            highlight: false,
        },
    ];

    // Card 6 for balanced 2x3 or 3x2 grid when in grid mode
    const summaryCard = {
        id: "health",
        step: "KPI",
        title: "Pipeline Health",
        subtitle: "Accuracy & throughput",
        count: `${accuracyRate}%`,
        icon: ShieldCheck,
        iconBg: "bg-indigo-50 text-indigo-600 border-indigo-200/80 group-hover:bg-indigo-600 group-hover:text-white",
        borderHover: "hover:border-indigo-300 hover:shadow-indigo-500/10",
        barColor: "bg-indigo-500",
        badgeText: totalActive === 0 ? "Queue Clear" : `${totalActive} In Flight`,
        badgeColor: totalActive === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-indigo-50 text-indigo-700 border-indigo-200",
        href: "/analytics",
        highlight: false,
    };

    return (
        <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs transition-all">
            {/* Top decorative gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-purple-500 via-amber-500 via-emerald-500 to-teal-500 opacity-80" />

            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3.5 border-b border-slate-100">
                <div className="flex items-start sm:items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 text-primary border border-indigo-100/80 shadow-2xs shrink-0">
                        <Workflow className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                                Live Processing Pipeline
                            </h2>
                            {/* Live Stream Pulse Badge */}
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                <span className="relative flex h-1.5 w-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                </span>
                                <span>Live Stream</span>
                            </span>

                            {totalActive > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    <Flame className="w-3 h-3 text-amber-500 animate-pulse" />
                                    <span>{totalActive} in flight</span>
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Real-time document throughput across ingestion, AI extraction, and human audit
                        </p>
                    </div>
                </div>

                {/* Right Header Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                    {/* View Switcher on screens < lg */}
                    <div className="flex lg:hidden items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                        <button
                            onClick={() => setViewMode("flow")}
                            className={cn(
                                "px-2 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer",
                                viewMode === "flow"
                                    ? "bg-white text-slate-900 shadow-2xs"
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                            title="Horizontal Flow Track"
                        >
                            <SlidersHorizontal className="w-3 h-3" />
                            <span>Flow</span>
                        </button>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "px-2 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1 cursor-pointer",
                                viewMode === "grid"
                                    ? "bg-white text-slate-900 shadow-2xs"
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                            title="Grid Overview"
                        >
                            <LayoutGrid className="w-3 h-3" />
                            <span>Grid</span>
                        </button>
                    </div>

                    <Link
                        href="/documents"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors border border-primary/15"
                    >
                        <span>View Queue</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            {/* Pipeline Stage Cards Container */}
            {/* Desktop (lg+): Clean 5-column layout */}
            {/* Mobile/Tablet (< lg): Smooth Horizontal Flow Track with snap scroll OR 2x3 Balanced Grid */}
            <div
                className={cn(
                    "relative",
                    viewMode === "flow"
                        ? "flex lg:grid lg:grid-cols-5 gap-3 overflow-x-auto no-scrollbar snap-x pb-2 pt-1 -mx-1 px-1"
                        : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
                )}
            >
                {(viewMode === "grid" ? [...stages, summaryCard] : stages).map((stage) => {
                    const Icon = stage.icon;
                    const isSummary = stage.id === "health";

                    return (
                        <div
                            key={stage.id}
                            className={cn(
                                "relative flex flex-col flex-1",
                                viewMode === "flow"
                                    ? "min-w-[170px] sm:min-w-[190px] lg:min-w-0 snap-start"
                                    : "w-full min-w-0"
                            )}
                        >
                            <Link
                                href={stage.href}
                                className={cn(
                                    "group relative flex flex-col justify-between h-full p-3.5 sm:p-4 rounded-xl border transition-all duration-200 text-left bg-white",
                                    stage.borderHover,
                                    "hover:shadow-md hover:-translate-y-0.5",
                                    stage.highlight
                                        ? "border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/20 shadow-xs"
                                        : "border-slate-200/80"
                                )}
                            >
                                {/* Top: Icon and Step badge / status pill */}
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <div
                                        className={cn(
                                            "w-9 h-9 rounded-lg flex items-center justify-center border transition-all duration-200 shadow-2xs shrink-0",
                                            stage.iconBg
                                        )}
                                    >
                                        <Icon className="w-4.5 h-4.5" />
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                            {stage.step}
                                        </span>
                                        {stage.badgeText && (
                                            <span
                                                className={cn(
                                                    "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border",
                                                    stage.badgeColor
                                                )}
                                            >
                                                {stage.badgeText}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Metric & Titles */}
                                <div className="my-1">
                                    <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                                        {isLoading ? (
                                            <div className="h-7 w-12 bg-slate-100 rounded animate-pulse my-0.5" />
                                        ) : typeof stage.count === "number" ? (
                                            stage.count.toLocaleString()
                                        ) : (
                                            stage.count
                                        )}
                                    </div>
                                    <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1 group-hover:text-primary transition-colors">
                                        <span>{stage.title}</span>
                                        <ArrowRight className="w-3 h-3 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100" />
                                    </div>
                                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                        {stage.subtitle}
                                    </p>
                                </div>

                                {/* Bottom Progress Bar & Volume Share */}
                                <div className="mt-3 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[10px] text-slate-400">
                                    <span className="font-medium">
                                        {isSummary
                                            ? "Overall Health"
                                            : totalPipeline > 0 && typeof stage.count === "number"
                                            ? `${Math.round((stage.count / totalPipeline) * 100)}% share`
                                            : "Awaiting input"}
                                    </span>

                                    <div className="w-14 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-500",
                                                stage.barColor,
                                                typeof stage.count === "number" && stage.count > 0
                                                    ? "w-full"
                                                    : isSummary
                                                    ? "w-full"
                                                    : "w-1.5"
                                            )}
                                        />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    );
                })}
            </div>

            {/* Mobile/Tablet Swipe Hint when in Flow mode */}
            {viewMode === "flow" && (
                <div className="flex lg:hidden items-center justify-between pt-2.5 px-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-medium text-slate-500">
                        <span>Swipe to explore stages</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                    </span>
                    <div className="flex items-center gap-1.5">
                        {stages.map((st) => (
                            <span
                                key={st.id}
                                className={cn(
                                    "h-1.5 rounded-full transition-all",
                                    st.highlight
                                        ? "w-4 bg-amber-500"
                                        : "w-2 bg-slate-200"
                                )}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPipelineFlow;
