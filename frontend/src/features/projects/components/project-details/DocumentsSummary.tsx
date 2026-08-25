import React from "react";
import { useGetDocumentsSummaryQuery } from "@/features/documents/documentApi";
import { CheckCircle2, RefreshCw, BadgeCheck, AlertCircle, Download } from "lucide-react";

export interface IDocumentsSummaryProps {
    projectId: string;
}

const DocumentsSummary: React.FC<IDocumentsSummaryProps> = ({ projectId }) => {
    const { data: summaryData, isLoading } = useGetDocumentsSummaryQuery({ projectId });
    const summary = summaryData?.data;

    return (
        <>
            <h2 className="font-headline-md text-headline-md text-text-primary">Documents Summary</h2>
            <div className="bg-surface border border-border-subtle rounded-xl p-md flex flex-col gap-sm hover:border-primary/30 transition-colors shadow-sm">
                {isLoading || !summary ? (
                    <div className="py-md text-center text-secondary text-sm">Loading...</div>
                ) : (
                    <>
                        <div className="flex justify-between items-center py-xs border-b border-border-subtle">
                            <span className="font-body-sm text-body-sm text-secondary">Total Selected</span>
                            <span className="font-label-md text-label-md text-text-primary">{summary.TOTAL || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-border-subtle">
                            <span className="font-body-sm text-body-sm text-tertiary flex items-center gap-xs">
                                <CheckCircle2 size={16} /> Uploaded
                            </span>
                            <span className="font-label-md text-label-md text-text-primary">{summary.UPLOADED || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-border-subtle">
                            <span className="font-body-sm text-body-sm text-primary flex items-center gap-xs">
                                <RefreshCw size={16} /> Transformed
                            </span>
                            <span className="font-label-md text-label-md text-text-primary">{summary.TRANSFORMED || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-border-subtle">
                            <span className="font-body-sm text-body-sm text-success flex items-center gap-xs">
                                <BadgeCheck size={16} /> Verified
                            </span>
                            <span className="font-label-md text-label-md text-text-primary">{summary.VERIFIED || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-xs border-b border-border-subtle">
                            <span className="font-body-sm text-body-sm text-error flex items-center gap-xs">
                                <AlertCircle size={16} /> Rejected
                            </span>
                            <span className="font-label-md text-label-md text-text-primary">{summary.REJECTED || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-xs">
                            <span className="font-body-sm text-body-sm text-secondary flex items-center gap-xs">
                                <Download size={16} /> Exported
                            </span>
                            <span className="font-label-md text-label-md text-text-primary">{summary.EXPORTED || 0}</span>
                        </div>
                    </>
                )}
            </div>
        </>
    )
}

export default DocumentsSummary;