"use client";

import React from "react";
import { Document } from "@/features/documents/documentApi";
import DataTable, { DataTableColumn } from "@/components/ui/data-table/DataTable";
import { cn, formatDate, formatSize, getFileType } from "@/lib/utils";
import {
    FileText,
    Folder,
    Check,
    X,
    Eye,
    Sparkles,
    Loader2,
    Calendar,
    Tag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { normalizeExtractedFields, getPreviewFields } from "../utils/extractedFields";
import { usePermissions } from "@/features/auth/hooks/usePermissions";

export interface VerificationQueueTableProps {
    documents: Document[];
    isLoading: boolean;
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onToggleSelectAll: () => void;
    onReviewDocument: (document: Document, index: number) => void;
    onQuickApprove: (documentId: string) => void;
    onRejectDocument: (document: Document) => void;
    processingDocId?: string | null;
}

const statusBadgeStyles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    TRANSFORMED: {
        bg: "bg-amber-50 border-amber-200/80",
        text: "text-amber-700",
        dot: "bg-amber-500 animate-pulse",
        label: "Ready for Review",
    },
    REVIEW_REQUIRED: {
        bg: "bg-rose-50 border-rose-200/80",
        text: "text-rose-700",
        dot: "bg-rose-500 animate-pulse",
        label: "Attention Needed",
    },
    VERIFIED: {
        bg: "bg-emerald-50 border-emerald-200/80",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
        label: "Verified",
    },
    EXPORTED: {
        bg: "bg-emerald-50 border-emerald-200/80",
        text: "text-emerald-700",
        dot: "bg-emerald-500",
        label: "Exported",
    },
    REJECTED: {
        bg: "bg-rose-50 border-rose-200/80",
        text: "text-rose-700",
        dot: "bg-rose-500",
        label: "Rejected",
    },
    FAILED: {
        bg: "bg-rose-50 border-rose-200/80",
        text: "text-rose-700",
        dot: "bg-rose-500",
        label: "Failed",
    },
};

const VerificationQueueTable: React.FC<VerificationQueueTableProps> = ({
    documents,
    isLoading,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    onReviewDocument,
    onQuickApprove,
    onRejectDocument,
    processingDocId,
}) => {
    const { can } = usePermissions();
    const canVerify = can("verify_documents");
    const isAllSelected = documents.length > 0 && documents.every((d) => selectedIds.has(d._id));
    const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

    const columns: DataTableColumn<Document>[] = [
        ...(canVerify
            ? [
                  {
                      id: "select",
                      header: (
                          <div className="flex items-center justify-center">
                              <input
                                  type="checkbox"
                                  checked={isAllSelected}
                                  ref={(el) => {
                                      if (el) el.indeterminate = isSomeSelected;
                                  }}
                                  onChange={onToggleSelectAll}
                                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                                  title="Select all documents on this page"
                              />
                          </div>
                      ),
                      className: "w-10 text-center px-3",
                      cell: (doc: Document) => (
                          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                  type="checkbox"
                                  checked={selectedIds.has(doc._id)}
                                  onChange={() => onToggleSelect(doc._id)}
                                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                              />
                          </div>
                      ),
                  } as DataTableColumn<Document>,
              ]
            : []),
        {
            id: "document",
            header: "Document",
            cell: (doc) => {
                const fileName = doc.originalFileName || doc.originalFilename;
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 max-w-56 sm:max-w-64">
                            <p
                                className="font-semibold text-[13px] text-slate-900 truncate hover:text-primary transition-colors cursor-pointer"
                                title={fileName}
                                onClick={() => onReviewDocument(doc, documents.indexOf(doc))}
                            >
                                {fileName}
                            </p>
                            <p className="text-secondary text-[11px] truncate flex items-center gap-1.5 mt-0.5">
                                <span>{getFileType(doc.mimeType, fileName)}</span>
                                <span>•</span>
                                <span>{formatSize(doc.sizeBytes)}</span>
                            </p>
                        </div>
                    </div>
                );
            },
        },
        {
            id: "project",
            header: "Project",
            cell: (doc: any) => {
                const projectName = typeof doc.projectId === "object" ? doc.projectId?.name : null;
                const projectId = typeof doc.projectId === "object" ? doc.projectId?._id : doc.projectId;
                if (!projectName) return <span className="text-slate-400 text-xs">—</span>;

                return (
                    <Link
                        href={`/project/${projectId}`}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-primary font-medium truncate max-w-40 transition-colors"
                        title={projectName}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Folder className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{projectName}</span>
                    </Link>
                );
            },
        },
        {
            id: "extractedData",
            header: "Extracted Summary",
            cell: (doc: any) => {
                const rawAiData = doc.processingDetails?.aiResponse?.data;
                const fields = normalizeExtractedFields(rawAiData);
                if (fields.length === 0) {
                    return <span className="text-slate-400 text-xs italic">Pending extraction</span>;
                }

                const preview = getPreviewFields(fields, 1);
                const firstField = preview[0];
                const displaySummary = firstField
                    ? `${firstField.label}: ${firstField.value || "—"}`
                    : "No fields";

                return (
                    <div className="flex flex-col gap-0.5 max-w-56">
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-800 font-medium truncate" title={displaySummary}>
                            <Tag className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="truncate">{displaySummary}</span>
                        </div>
                        {fields.length > 1 && (
                            <span className="text-[10px] text-amber-700/80 font-medium pl-4.5">
                                +{fields.length - 1} more fields extracted
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            id: "status",
            header: "Review State",
            cell: (doc: any) => {
                const config = statusBadgeStyles[doc.status] || {
                    bg: "bg-slate-100 border-slate-200",
                    text: "text-slate-700",
                    dot: "bg-slate-400",
                    label: doc.status?.replaceAll("_", " "),
                };

                return (
                    <span
                        className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                            config.bg,
                            config.text
                        )}
                    >
                        <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
                        {config.label}
                    </span>
                );
            },
        },
        {
            id: "age",
            header: "Wait Time",
            cell: (doc) => (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span title={new Date(doc.createdAt).toLocaleString()}>
                        {formatDate(doc.createdAt)}
                    </span>
                </div>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            headerClassName: "text-right pr-4",
            className: "text-right pr-4",
            cell: (doc: Document) => {
                const index = documents.indexOf(doc);
                const isItemProcessing = processingDocId === doc._id;

                return (
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* Primary Review Button */}
                        <Button
                            size="sm"
                            onClick={() => onReviewDocument(doc, index)}
                            className="bg-primary/90 hover:bg-primary text-white text-xs px-2.5 py-1 h-8 rounded-lg font-medium flex items-center gap-1 shadow-xs cursor-pointer"
                            title="Open side-by-side verification workbench"
                        >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review</span>
                        </Button>

                        {/* Quick Approve Button (if not already verified and user has verify permission) */}
                        {canVerify && doc.status !== "VERIFIED" && doc.status !== "EXPORTED" && (
                            <Button
                                variant="outline"
                                size="icon-sm"
                                disabled={isItemProcessing}
                                onClick={() => onQuickApprove(doc._id)}
                                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 transition-colors h-8 w-8 cursor-pointer"
                                title="Quick Approve (1-click sign-off)"
                            >
                                {isItemProcessing ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                                ) : (
                                    <Check className="w-4 h-4" />
                                )}
                            </Button>
                        )}

                        {/* Reject Button (if user has verify permission) */}
                        {canVerify && doc.status !== "REJECTED" && (
                            <Button
                                variant="outline"
                                size="icon-sm"
                                disabled={isItemProcessing}
                                onClick={() => onRejectDocument(doc)}
                                className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition-colors h-8 w-8 cursor-pointer"
                                title="Reject / Flag document"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <DataTable
            data={documents}
            columns={columns}
            getRowId={(doc) => doc._id}
            isLoading={isLoading}
            onRowClick={(doc) => onReviewDocument(doc, documents.indexOf(doc))}
            emptyMessage="No documents currently pending verification in this queue."
        />
    );
};

export default VerificationQueueTable;
