import React, { Suspense } from "react";
import SupportWorkspace from "@/features/support/components/SupportWorkspace";

export const metadata = {
    title: "Support & Docs | StructurFlow",
    description: "Knowledge base, API documentation, and engineering support for StructurFlow.",
};

export default function SupportPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Support Center...</div>}>
            <SupportWorkspace />
        </Suspense>
    );
}
