"use client";

import React, { useState } from "react";
import { StatusDistributionItem } from "../analyticsApi";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, FileUp, XCircle, Share2, Layers } from "lucide-react";

interface StatusDistributionChartProps {
    data: StatusDistributionItem[];
    total: number;
    isLoading?: boolean;
}

const STATUS_META: Record<
    string,
    { label: string; color: string; bg: string; stroke: string; icon: React.ElementType }
> = {
    VERIFIED: {
        label: "Verified & Approved",
        color: "text-emerald-700",
        bg: "bg-emerald-500",
        stroke: "#10b981",
        icon: CheckCircle2,
    },
    TRANSFORMED: {
        label: "Awaiting Verification",
        color: "text-indigo-700",
        bg: "bg-indigo-500",
        stroke: "#6366f1",
        icon: Clock,
    },
    UPLOADED: {
        label: "Raw Ingested",
        color: "text-sky-700",
        bg: "bg-sky-500",
        stroke: "#0ea5e9",
        icon: FileUp,
    },
    REJECTED: {
        label: "Flagged / Rejected",
        color: "text-rose-700",
        bg: "bg-rose-500",
        stroke: "#f43f5e",
        icon: XCircle,
    },
    EXPORTED: {
        label: "Exported / Completed",
        color: "text-purple-700",
        bg: "bg-purple-500",
        stroke: "#a855f7",
        icon: Share2,
    },
};

const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({
    data,
    total,
    isLoading,
}) => {
    const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);

    // SVG Donut metrics
    const radius = 68;
    const strokeWidth = 22;
    const circumference = 2 * Math.PI * radius;

    // Compute cumulative offsets
    let cumulativePercent = 0;
    const segments = (data || []).map((item) => {
        const meta = STATUS_META[item.status] || {
            label: item.status,
            color: "text-slate-600",
            bg: "bg-slate-400",
            stroke: "#94a3b8",
            icon: Layers,
        };

        const percent = total > 0 ? (item.count / total) * 100 : 0;
        const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
        const strokeDashoffset = -((cumulativePercent / 100) * circumference);
        cumulativePercent += percent;

        return {
            ...item,
            meta,
            percent,
            strokeDasharray,
            strokeDashoffset,
        };
    });

    const activeItem = hoveredStatus ? segments.find((s) => s.status === hoveredStatus) : null;

    return (
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between gap-4">
            <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                    Document Processing Pipeline State
                </h3>
                <p className="text-xs text-slate-500">
                    Distribution of files across ingestion, review, and sign-off stages.
                </p>
            </div>

            {isLoading ? (
                <div className="h-56 bg-slate-50 rounded-lg animate-pulse flex items-center justify-center text-xs text-slate-400">
                    Calculating status distributions...
                </div>
            ) : total === 0 ? (
                <div className="h-56 flex items-center justify-center text-xs text-slate-400">
                    No documents recorded in this scope.
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
                    {/* SVG Donut */}
                    <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
                            {/* Background Track */}
                            <circle
                                cx="90"
                                cy="90"
                                r={radius}
                                fill="transparent"
                                stroke="#f1f5f9"
                                strokeWidth={strokeWidth}
                            />

                            {/* Donut Segments */}
                            {segments.map((seg) => {
                                const isHovered = hoveredStatus === seg.status;
                                return (
                                    <circle
                                        key={seg.status}
                                        cx="90"
                                        cy="90"
                                        r={radius}
                                        fill="transparent"
                                        stroke={seg.meta.stroke}
                                        strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                                        strokeDasharray={seg.strokeDasharray}
                                        strokeDashoffset={seg.strokeDashoffset}
                                        strokeLinecap="butt"
                                        className="transition-all duration-200 cursor-pointer"
                                        onMouseEnter={() => setHoveredStatus(seg.status)}
                                        onMouseLeave={() => setHoveredStatus(null)}
                                    />
                                );
                            })}
                        </svg>

                        {/* Central Label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                            <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono">
                                {activeItem ? activeItem.count : total.toLocaleString()}
                            </span>
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 max-w-[80px] truncate">
                                {activeItem ? activeItem.meta.label.split(" ")[0] : "Documents"}
                            </span>
                        </div>
                    </div>

                    {/* Breakdown Legend List */}
                    <div className="flex-1 flex flex-col gap-2.5 w-full">
                        {segments.map((seg) => {
                            const Icon = seg.meta.icon;
                            const isHovered = hoveredStatus === seg.status;

                            return (
                                <div
                                    key={seg.status}
                                    onMouseEnter={() => setHoveredStatus(seg.status)}
                                    onMouseLeave={() => setHoveredStatus(null)}
                                    className={cn(
                                        "p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 text-xs",
                                        isHovered
                                            ? "bg-slate-50 border-slate-300 shadow-2xs"
                                            : "border-transparent hover:bg-slate-50/60"
                                    )}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span
                                            className={cn("w-2.5 h-2.5 rounded-full shrink-0", seg.meta.bg)}
                                        />
                                        <span className="font-medium text-slate-700 truncate">
                                            {seg.meta.label}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="font-bold text-slate-900 font-mono">
                                            {seg.count.toLocaleString()}
                                        </span>
                                        <span className="w-12 text-right text-[11px] font-semibold text-slate-400 font-mono">
                                            {seg.percentage}%
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatusDistributionChart;
