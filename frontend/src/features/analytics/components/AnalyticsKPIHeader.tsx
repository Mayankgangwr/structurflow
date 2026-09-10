"use client";

import React from "react";
import {
    TrendingUp,
    TrendingDown,
    FileText,
    ShieldCheck,
    Clock,
    HardDrive,
    Minus,
} from "lucide-react";
import { AnalyticsOverview } from "../analyticsApi";
import { cn } from "@/lib/utils";

interface AnalyticsKPIHeaderProps {
    overview?: AnalyticsOverview;
    isLoading?: boolean;
    periodLabel?: string;
}

const AnalyticsKPIHeader: React.FC<AnalyticsKPIHeaderProps> = ({
    overview,
    isLoading,
    periodLabel = "vs prior period",
}) => {
    const formatStorage = (bytes: number): string => {
        if (!bytes || bytes === 0) return "0 MB";
        const mb = bytes / (1024 * 1024);
        if (mb >= 1024) {
            return `${(mb / 1024).toFixed(2)} GB`;
        }
        return `${mb.toFixed(1)} MB`;
    };

    const renderTrendBadge = (delta: number, suffix = "%") => {
        if (delta === 0) {
            return (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    <Minus className="w-3 h-3" />
                    <span>0{suffix}</span>
                </span>
            );
        }
        const isPositive = delta > 0;
        return (
            <span
                className={cn(
                    "inline-flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded",
                    isPositive
                        ? "text-emerald-700 bg-emerald-50 border border-emerald-200/80"
                        : "text-rose-700 bg-rose-50 border border-rose-200/80"
                )}
            >
                {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                ) : (
                    <TrendingDown className="w-3 h-3" />
                )}
                <span>
                    {isPositive ? `+${delta}` : delta}
                    {suffix}
                </span>
            </span>
        );
    };

    const cards = [
        {
            id: "ingestion",
            label: "Documents Ingested",
            value: overview ? overview.totalDocuments.toLocaleString() : "0",
            sub: overview ? `${overview.totalAllTime.toLocaleString()} total all-time` : "Processing files",
            trend: overview?.trends?.documentsDelta ?? 0,
            icon: FileText,
            color: "text-indigo-600",
            iconBg: "bg-indigo-100/70 text-indigo-700",
            border: "border-indigo-100",
        },
        {
            id: "accuracy",
            label: "Verification Accuracy",
            value: overview ? `${overview.accuracyRate}%` : "0%",
            sub: overview
                ? `${overview.verifiedDocuments} verified, ${overview.rejectedDocuments} rejected`
                : "Human audit sign-off rate",
            trend: overview?.trends?.accuracyDelta ?? 0,
            trendSuffix: " pts",
            icon: ShieldCheck,
            color: "text-emerald-600",
            iconBg: "bg-emerald-100/70 text-emerald-700",
            border: "border-emerald-100",
        },
        {
            id: "backlog",
            label: "Verification Backlog",
            value: overview ? overview.backlogCount.toLocaleString() : "0",
            sub: "Awaiting HITL verification review",
            icon: Clock,
            color: "text-amber-600",
            iconBg: "bg-amber-100/70 text-amber-700",
            border: "border-amber-100",
            highlightPill: overview && overview.backlogCount > 0 ? "Requires Review" : "Queue Clear",
        },
        {
            id: "storage",
            label: "Storage Consumed",
            value: overview ? formatStorage(overview.storageBytes) : "0 MB",
            sub: "Encrypted cloud document assets",
            icon: HardDrive,
            color: "text-purple-600",
            iconBg: "bg-purple-100/70 text-purple-700",
            border: "border-purple-100",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <div
                        key={card.id}
                        className="relative p-3.5 sm:p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all duration-200"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    {card.label}
                                </span>

                                {isLoading ? (
                                    <div className="h-8 w-20 bg-slate-100 rounded animate-pulse my-1.5" />
                                ) : (
                                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight my-1">
                                        {card.value}
                                    </div>
                                )}

                                <div className="text-xs text-slate-500 font-medium truncate">
                                    {card.sub}
                                </div>
                            </div>

                            <div className={cn("p-2 sm:p-2.5 rounded-xl shrink-0", card.iconBg)}>
                                <Icon className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                            {card.trend !== undefined ? (
                                <div className="flex items-center gap-1.5">
                                    {renderTrendBadge(card.trend, card.trendSuffix || "%")}
                                    <span className="text-slate-400 font-medium">{periodLabel}</span>
                                </div>
                            ) : card.highlightPill ? (
                                <span
                                    className={cn(
                                        "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                                        card.highlightPill === "Queue Clear"
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : "bg-amber-50 text-amber-800 border border-amber-200"
                                    )}
                                >
                                    {card.highlightPill}
                                </span>
                            ) : (
                                <span className="text-slate-400 font-medium">Enterprise Tier Storage</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default AnalyticsKPIHeader;
