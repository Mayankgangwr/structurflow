"use client";

import React from "react";
import { ReviewerStatItem } from "../analyticsApi";
import { Award, CheckCircle2, XCircle, Users, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewerEfficiencyCardProps {
    reviewers: ReviewerStatItem[];
    isLoading?: boolean;
}

const ReviewerEfficiencyCard: React.FC<ReviewerEfficiencyCardProps> = ({
    reviewers,
    isLoading,
}) => {
    const getRankBadge = (index: number) => {
        if (index === 0) {
            return "bg-amber-100 text-amber-800 border-amber-300";
        }
        if (index === 1) {
            return "bg-slate-200 text-slate-800 border-slate-300";
        }
        if (index === 2) {
            return "bg-orange-100 text-orange-800 border-orange-300";
        }
        return "bg-slate-50 text-slate-600 border-slate-200";
    };

    return (
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
                <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500" />
                        Human-in-the-Loop Reviewer Velocity
                    </h3>
                    <p className="text-xs text-slate-500">
                        Top verification reviewers ensuring document accuracy and pipeline quality.
                    </p>
                </div>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    Quality Audit Trail
                </span>
            </div>

            {isLoading ? (
                <div className="flex flex-col gap-2 py-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-10 bg-slate-100/70 rounded-lg animate-pulse" />
                    ))}
                </div>
            ) : reviewers.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">
                    No human verification logs recorded in this period yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {reviewers.map((rev, index) => {
                        return (
                            <div
                                key={rev.userId + index}
                                className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-between gap-2.5"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    {/* Rank badge */}
                                    <span
                                        className={cn(
                                            "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0",
                                            getRankBadge(index)
                                        )}
                                    >
                                        {index + 1}
                                    </span>

                                    {/* Avatar */}
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0 uppercase overflow-hidden">
                                        {rev.avatar ? (
                                            <img
                                                src={rev.avatar}
                                                alt={rev.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            rev.name.slice(0, 2)
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <div className="font-semibold text-xs text-slate-800 truncate">
                                            {rev.name}
                                        </div>
                                        <div className="text-[10px] text-slate-400 truncate">
                                            {rev.email || "Workspace Reviewer"}
                                        </div>
                                    </div>
                                </div>

                                {/* Reviewer stats */}
                                <div className="text-right shrink-0">
                                    <div className="text-xs font-bold text-slate-900 font-mono">
                                        {rev.totalAudited} audited
                                    </div>
                                    <div className="text-[10px] font-semibold text-emerald-600">
                                        {rev.approvalRate}% approved
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ReviewerEfficiencyCard;
