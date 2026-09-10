"use client";

import React, { useState } from "react";
import SettingsTabsNav, { SettingsTabType } from "./SettingsTabsNav";
import ProfileSettingsTab from "./ProfileSettingsTab";
import OrganizationSettingsTab from "./OrganizationSettingsTab";
import SystemStorageSettingsTab from "./SystemStorageSettingsTab";

export const SettingsWorkspace: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTabType>("profile");

    return (
        <div className="p-3 xs:p-5 sm:p-6 max-w-full mx-auto w-full space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workspace Settings</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Manage your personal profile, organization identity, and system threshold parameters.
                </p>
            </div>

            {/* Navigation Tabs */}
            <SettingsTabsNav activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab Panes */}
            {activeTab === "profile" && <ProfileSettingsTab />}
            {activeTab === "organization" && <OrganizationSettingsTab />}
            {activeTab === "system" && <SystemStorageSettingsTab />}
        </div>
    );
};

export default SettingsWorkspace;
