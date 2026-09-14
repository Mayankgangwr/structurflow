import React, { Suspense } from "react";
import AnalyticsWorkspace from "@/features/analytics/components/AnalyticsWorkspace";

export const metadata = {
    title: "Analytics & Intelligence | StructurFlow",
    description: "Real-time analytics on document processing throughput, AI extraction accuracy, and verification performance.",
};

export default function AnalyticsPage() {
    return (
        <Suspense
            fallback={
                <div className="p-8 text-center text-xs text-slate-400">
                    Loading Analytics Workspace...
                </div>
            }
        >
            <AnalyticsWorkspace />
        </Suspense>
    );
}
