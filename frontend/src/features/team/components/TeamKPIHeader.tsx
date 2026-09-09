"use client";

import React from "react";
import { Users, ShieldCheck, ClipboardCheck, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TeamKPIHeaderProps {
    totalMembers: number;
    adminCount: number;
    reviewerCount: number;
    pendingInvitesCount: number;
    activeTab: "members" | "invites";
    onTabChange: (tab: "members" | "invites") => void;
    roleFilter: string;
    onRoleFilterChange: (role: string) => void;
}

const TeamKPIHeader: React.FC<TeamKPIHeaderProps> = ({
    totalMembers,
    adminCount,
    reviewerCount,
    pendingInvitesCount,
    activeTab,
    onTabChange,
    roleFilter,
    onRoleFilterChange,
}) => {
    const cards = [
        {
            id: "total",
            label: "Total Members",
            value: totalMembers,
            sub: "Active collaborators",
            icon: Users,
            color: "text-indigo-600",
            bg: "bg-indigo-50 border-indigo-200/80",
            isActive: activeTab === "members" && roleFilter === "ALL",
            onClick: () => {
                onTabChange("members");
                onRoleFilterChange("ALL");
            },
        },
        {
            id: "admins",
            label: "Admins & Owners",
            value: adminCount,
            sub: "Workspace management",
            icon: ShieldCheck,
            color: "text-purple-600",
            bg: "bg-purple-50 border-purple-200/80",
            isActive: activeTab === "members" && roleFilter === "ADMIN",
            onClick: () => {
                onTabChange("members");
                onRoleFilterChange("ADMIN");
            },
        },
        {
            id: "reviewers",
            label: "Verification Reviewers",
            value: reviewerCount,
            sub: "Document auditing & sign-off",
            icon: ClipboardCheck,
            color: "text-amber-600",
            bg: "bg-amber-50 border-amber-200/80",
            isActive: activeTab === "members" && roleFilter === "REVIEWER",
            onClick: () => {
                onTabChange("members");
                onRoleFilterChange("REVIEWER");
            },
        },
        {
            id: "invites",
            label: "Pending Invitations",
            value: pendingInvitesCount,
            sub: pendingInvitesCount > 0 ? "Awaiting acceptance" : "No pending invites",
            icon: Mail,
            color: "text-emerald-600",
            bg: "bg-emerald-50 border-emerald-200/80",
            isActive: activeTab === "invites",
            onClick: () => {
                onTabChange("invites");
            },
            highlight: pendingInvitesCount > 0,
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <div
                        key={card.id}
                        onClick={card.onClick}
                        className={cn(
                            "bg-white rounded-xl border p-3.5 sm:p-4 flex items-center justify-between transition-all duration-200 cursor-pointer shadow-xs",
                            card.isActive
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

export default TeamKPIHeader;
