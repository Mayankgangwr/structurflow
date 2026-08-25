import { FileText } from "lucide-react";
import React from "react";

interface IDocumentEmptyStateProps {
    projectId: string;
}

const DocumentEmptyState: React.FC<IDocumentEmptyStateProps> = ({ projectId }) => {
    return (
        <div className="bg-surface border border-border-subtle rounded-xl p-xl flex flex-col items-center justify-center text-center gap-sm mt-md min-h-[200px]">
            <FileText className="w-16 h-16 text-secondary mb-sm" />
            <h4 className="font-label-md text-label-md text-secondary">No documents uploaded yet</h4>
            <p className="font-body-sm text-body-sm text-secondary">Your uploaded documents will appear
                here once you start the transformation process.</p>
        </div>
    )
}

export default DocumentEmptyState;