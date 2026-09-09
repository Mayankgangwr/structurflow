"use client";

import React from "react";
import { Activity, ShieldCheck, FileUp, Users2, ArrowUpRight } from "lucide-react";
import { ActivityCategory, ActivityStats } from "../activityApi";
import { cn } from "@/lib/utils";

export interface ActivityKPIHeaderProps {
    stats?: ActivityStats;
    isLoading?: boolean;
    activeCategory: ActivityCategory;
    onCategoryChange: (category: ActivityCategory) => void;
    onActionReset?: () => void;
}

const ActivityKPIHeader: React.FC<ActivityKPIHeaderProps> = ({
    stats,
    isLoading,
    activeCategory,
    onCategoryChange,
    onActionReset,
}) => {
    const cards = [
        {
            id: "ALL" as ActivityCategory,
            label: "24h Activity Volume",
            value: stats?.total24h ?? 0,
            sub: "Total actions recorded",
            metaText: stats ? `${stats.totalAllTime.toLocaleString()} total all-time` : "Tracking system events",
            icon: Activity,
            color: "text-indigo-600",
            bg: "bg-indigo-50 border-indigo-200/70",
            activeBorder: "ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/40",
            iconBg: "bg-indigo-100/70 text-indigo-700",
        },
        {
            id: "VERIFICATION" as ActivityCategory,
            label: "Human Verifications",
            value: stats?.verifications24h ?? 0,
            sub: "Approved & rejected items",
            metaText: "Quality review actions",
            icon: ShieldCheck,
            color: "text-emerald-600",
            bg: "bg-emerald-50 border-emerald-200/70",
            activeBorder: "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/40",
            iconBg: "bg-emerald-100/70 text-emerald-700",
        },
        {
            id: "DOCUMENTS" as ActivityCategory,
            label: "Document Ingestions",
            value: stats?.uploads24h ?? 0,
            sub: "Files uploaded (24h)",
            metaText: "Pipeline transformation queue",
            icon: FileUp,
            color: "text-sky-600",
            bg: "bg-sky-50 border-sky-200/70",
            activeBorder: "ring-2 ring-sky-500 border-sky-500 bg-sky-50/40",
            iconBg: "bg-sky-100/70 text-sky-700",
        },
        {
            id: "TEAM" as ActivityCategory,
            label: "Governance & Team",
            value: stats?.teamUpdates24h ?? 0,
            sub: "Roles & invitations (24h)",
            metaText: "Workspace access events",
            icon: Users2,
            color: "text-purple-600",
            bg: "bg-purple-50 border-purple-200/70",
            activeBorder: "ring-2 ring-purple-500 border-purple-500 bg-purple-50/40",
            iconBg: "bg-purple-100/70 text-purple-700",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {cards.map((card) => {
                const Icon = card.icon;
                const isActive = activeCategory === card.id;

                return (
                    <div
                        key={card.id}
                        onClick={() => {
                            onCategoryChange(card.id);
                            if (onActionReset) onActionReset();
                        }}
                        className={cn(
                            "group relative p-3 sm:p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs transition-all duration-200 cursor-pointer select-none flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5",
                            isActive ? card.activeBorder : "hover:border-slate-300"
                        )}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                        {card.label}
                                    </span>
                                    {isActive && (
                                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                    )}
                                </div>

                                {isLoading ? (
                                    <div className="h-8 w-16 bg-slate-100 rounded animate-pulse my-1" />
                                ) : (
                                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight my-0.5">
                                        {card.value.toLocaleString()}
                                    </div>
                                )}

                                <div className="text-xs text-slate-500 font-medium truncate">
                                    {card.sub}
                                </div>
                            </div>

                            <div
                                className={cn(
                                    "p-2 sm:p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-105",
                                    card.iconBg
                                )}
                            >
                                <Icon className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="truncate">{card.metaText}</span>
                            <span className="inline-flex items-center gap-0.5 text-slate-500 group-hover:text-primary transition-colors font-medium">
                                Filter
                                <ArrowUpRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ActivityKPIHeader;
