"use client";

import React from "react";
import { ClipboardCheck, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VerificationKPIStats {
    total: number;
    uploaded: number;
    processing: number;
    transformed: number;
    verified: number;
    needsVerification: number;
    exported: number;
    failed: number;
}

export interface VerificationKPIHeaderProps {
    stats?: VerificationKPIStats;
    activeFilter: string;
    onSelectFilter: (filter: string) => void;
}

const VerificationKPIHeader: React.FC<VerificationKPIHeaderProps> = ({
    stats,
    activeFilter,
    onSelectFilter,
}) => {
    const total = stats?.total ?? 0;
    const needsVerification = stats?.needsVerification ?? 0;
    const verified = (stats?.verified ?? 0) + (stats?.exported ?? 0);
    const failed = stats?.failed ?? 0;
    const completionRate = total > 0 ? Math.round((verified / total) * 100) : 100;

    const cards = [
        {
            id: "needsVerification",
            label: "Pending Verification",
            value: needsVerification,
            sub: needsVerification > 0 ? "Requires human review" : "Queue is clear",
            icon: ClipboardCheck,
            color: "text-amber-600",
            bg: "bg-amber-50 border-amber-200/80",
            filter: "NEEDS_VERIFICATION",
            highlight: needsVerification > 0,
        },
        {
            id: "verified",
            label: "Verified & Approved",
            value: verified,
            sub: "Ready for downstream export",
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50 border-emerald-200/80",
            filter: "VERIFIED",
        },
        {
            id: "failed",
            label: "Flagged / Rejected",
            value: failed,
            sub: failed > 0 ? "Requires re-processing" : "Zero errors reported",
            icon: AlertTriangle,
            color: "text-rose-600",
            bg: "bg-rose-50 border-rose-200/80",
            filter: "REJECTED",
        },
        {
            id: "completionRate",
            label: "Verification Rate",
            value: `${completionRate}%`,
            sub: `${verified} of ${total} total docs`,
            icon: ShieldCheck,
            color: "text-indigo-600",
            bg: "bg-indigo-50 border-indigo-200/80",
            filter: "ALL",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {cards.map((card) => {
                const Icon = card.icon;
                const isSelected = activeFilter === card.filter;

                return (
                    <div
                        key={card.id}
                        onClick={() => onSelectFilter(card.filter)}
                        className={cn(
                            "bg-white rounded-xl border p-3.5 sm:p-4 flex items-center justify-between transition-all duration-200 cursor-pointer shadow-xs",
                            isSelected
                                ? "border-amber-500 ring-2 ring-amber-500/15 shadow-sm"
                                : "border-slate-200/80 hover:border-slate-300 hover:shadow-xs"
                        )}
                        title={`Filter by: ${card.label}`}
                    >
                        <div className="min-w-0 flex-1 pr-2">
                            <p className="text-[11px] sm:text-xs font-medium text-slate-500 truncate">
                                {card.label}
                            </p>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-0.5 tracking-tight">
                                {card.value}
                            </h3>
                            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate font-medium">
                                {card.sub}
                            </p>
                        </div>

                        <div
                            className={cn(
                                "w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                                card.bg
                            )}
                        >
                            <Icon
                                className={cn(
                                    "w-5 h-5",
                                    card.color,
                                    card.highlight && "animate-pulse"
                                )}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default VerificationKPIHeader;
