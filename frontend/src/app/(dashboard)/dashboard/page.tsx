import React, { Suspense } from "react";
import DashboardWorkspace from "@/features/dashboard/components/DashboardWorkspace";

export const metadata = {
    title: "Mission Control | StructurFlow",
    description: "Enterprise command center for AI document pipelines, verification queue, and operational throughput.",
};

export default function DashboardPage() {
    return (
        <Suspense
            fallback={
                <div className="p-8 text-center text-xs text-slate-400">
                    Loading Mission Control Dashboard...
                </div>
            }
        >
            <DashboardWorkspace />
        </Suspense>
    );
}