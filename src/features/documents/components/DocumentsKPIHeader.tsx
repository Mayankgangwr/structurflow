"use client";

import React from "react";
import { FileText, ClipboardCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DocumentsKPIStats {
    total: number;
    uploaded: number;
    processing: number;
    transformed: number;
    verified: number;
    needsVerification: number;
    exported: number;
    failed: number;
}

export interface DocumentsKPIHeaderProps {
    stats?: DocumentsKPIStats;
    activeStatusFilter?: string;
    onSelectStatus?: (status: string) => void;
}

const DocumentsKPIHeader: React.FC<DocumentsKPIHeaderProps> = ({
    stats,
    activeStatusFilter,
    onSelectStatus,
}) => {
    const total = stats?.total ?? 0;
    const needsVerification = stats?.needsVerification ?? 0;
    const processing = stats?.processing ?? 0;
    const exported = stats?.exported ?? 0;
    const exportRate = total > 0 ? Math.round((exported / total) * 100) : 0;

    const cards = [
        {
            id: "total",
            label: "Total Documents",
            value: total,
            sub: "Across all active projects",
            icon: FileText,
            color: "text-indigo-600",
            bg: "bg-indigo-50 border-indigo-100/80",
            statusFilter: "ALL",
        },
        {
            id: "needsVerification",
            label: "Needs Verification",
            value: needsVerification,
            sub: needsVerification > 0 ? "Requires review" : "Queue clear",
            icon: ClipboardCheck,
            color: "text-amber-600",
            bg: "bg-amber-50 border-amber-100/80",
            statusFilter: "NEEDS_VERIFICATION",
            highlight: needsVerification > 0,
        },
        {
            id: "processing",
            label: "In Processing",
            value: processing,
            sub: "OCR & AI extraction",
            icon: Sparkles,
            color: "text-blue-600",
            bg: "bg-blue-50 border-blue-100/80",
            statusFilter: "PROCESSING",
            isPulse: processing > 0,
        },
        {
            id: "exported",
            label: "Completed & Exported",
            value: exported,
            sub: `${exportRate}% completion rate`,
            icon: CheckCircle2,
            color: "text-emerald-600",
            bg: "bg-emerald-50 border-emerald-100/80",
            statusFilter: "EXPORTED",
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-2">
            {cards.map((card) => {
                const Icon = card.icon;
                const isSelected = activeStatusFilter === card.statusFilter;

                return (
                    <div
                        key={card.id}
                        onClick={() => onSelectStatus && onSelectStatus(card.statusFilter)}
                        className={cn(
                            "bg-white rounded-xl border p-3.5 sm:p-4 flex items-center justify-between transition-all duration-200 cursor-pointer shadow-xs",
                            isSelected
                                ? "border-primary ring-2 ring-primary/10 shadow-sm"
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
                                    card.isPulse && "animate-pulse"
                                )}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DocumentsKPIHeader;
