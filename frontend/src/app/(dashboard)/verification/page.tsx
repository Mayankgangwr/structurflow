import React, { Suspense } from "react";
import VerificationWorkspace from "@/features/verification/components/VerificationWorkspace";

export const metadata = {
    title: "Verification Queue | StructurFlow",
    description: "Enterprise human-in-the-loop document auditing and schema verification workbench",
};

export default function VerificationPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Verification Queue...</div>}>
            <VerificationWorkspace />
        </Suspense>
    );
}
