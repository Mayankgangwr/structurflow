import React, { Suspense } from "react";
import SettingsWorkspace from "@/features/settings/components/SettingsWorkspace";

export const metadata = {
    title: "Settings | StructurFlow",
    description: "Manage personal profile, organization identity, and system threshold parameters.",
};

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Workspace Settings...</div>}>
            <SettingsWorkspace />
        </Suspense>
    );
}
