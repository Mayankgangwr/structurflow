import React, { Suspense } from "react";
import DocumentsWorkspace from "@/features/documents/components/DocumentsWorkspace";

export const metadata = {
    title: "Documents | StructurFlow",
    description: "Enterprise document management and automated extraction pipeline",
};

export default function DocumentsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Documents Workspace...</div>}>
            <DocumentsWorkspace />
        </Suspense>
    );
}
