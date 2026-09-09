import React, { Suspense } from "react";
import ActivityWorkspace from "@/features/activity/components/ActivityWorkspace";

export const metadata = {
    title: "Activity Log & Audit Trail | StructurFlow",
    description: "Real-time tamper-evident audit logs of document extractions, human verifications, project updates, and team actions.",
};

export default function ActivityPage() {
    return (
        <Suspense
            fallback={
                <div className="p-8 text-center text-xs text-slate-400">
                    Loading Activity Workspace...
                </div>
            }
        >
            <ActivityWorkspace />
        </Suspense>
    );
}
