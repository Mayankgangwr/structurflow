"use client";

import React from "react";
import { User, Building, Database } from "lucide-react";
import { cn } from "@/lib/utils";

export type SettingsTabType = "profile" | "organization" | "system";

export interface SettingsTabsNavProps {
    activeTab: SettingsTabType;
    onTabChange: (tab: SettingsTabType) => void;
}

export const SettingsTabsNav: React.FC<SettingsTabsNavProps> = ({
    activeTab,
    onTabChange,
}) => {
    const tabs: { id: SettingsTabType; label: string; icon: React.FC<{ className?: string }> }[] = [
        { id: "profile", label: "Profile & Security", icon: User },
        { id: "organization", label: "Organization & Team", icon: Building },
        { id: "system", label: "System & Storage", icon: Database },
    ];

    return (
        <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto">
            {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "flex items-center gap-2 pb-3 px-1 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap cursor-pointer",
                            isActive
                                ? "border-primary text-primary"
                                : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                        )}
                    >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default SettingsTabsNav;
