import React, { Suspense } from "react";
import TeamWorkspace from "@/features/team/components/TeamWorkspace";

export const metadata = {
    title: "Team & Permissions | StructurFlow",
    description: "Manage organization team members, assign role-based permissions, and track active invitations.",
};

export default function TeamPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Team Workspace...</div>}>
            <TeamWorkspace />
        </Suspense>
    );
}
