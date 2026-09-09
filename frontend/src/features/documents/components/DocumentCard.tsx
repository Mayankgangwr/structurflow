"use client";

import React from "react";
import { Document } from "@/features/documents/documentApi";
import { cn, formatDate, formatSize, getFileType } from "@/lib/utils";
import { Eye, FileText, Download, Sparkles, FileCheck, Trash2, Loader2, FileImage, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/features/auth/hooks/usePermissions";

export interface DocumentCardProps {
    document: Document & { projectId?: { _id: string; name: string } | string };
    projectName?: string;
    isProcessing?: boolean;
    onView: (document: Document) => void;
    onProcess: (documentId: string) => void;
    onVerifyOrExport: (documentId: string) => void;
    onDelete: (documentId: string) => void;
}

const statusConfig: Record<string, { badgeClass: string; label: string; dotClass: string }> = {
    UPLOADED: {
        badgeClass: "bg-blue-50 text-blue-700 border-blue-200/80",
        label: "UPLOADED",
        dotClass: "bg-blue-500",
    },
    PROCESSING: {
        badgeClass: "bg-amber-50 text-amber-700 border-amber-200/80",
        label: "PROCESSING",
        dotClass: "bg-amber-500 animate-pulse",
    },
    TRANSFORMED: {
        badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
        label: "TRANSFORMED",
        dotClass: "bg-indigo-500 animate-pulse",
    },
    VERIFIED: {
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        label: "VERIFIED",
        dotClass: "bg-emerald-500",
    },
    EXPORTED: {
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
        label: "EXPORTED",
        dotClass: "bg-emerald-500",
    },
    REVIEW_REQUIRED: {
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80",
        label: "REVIEW REQUIRED",
        dotClass: "bg-rose-500",
    },
    TRUSTED: {
        badgeClass: "bg-teal-50 text-teal-700 border-teal-200/80",
        label: "TRUSTED",
        dotClass: "bg-teal-500",
    },
    REJECTED: {
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80",
        label: "REJECTED",
        dotClass: "bg-rose-500",
    },
    FAILED: {
        badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80",
        label: "FAILED",
        dotClass: "bg-rose-500",
    },
};

const DocumentCard: React.FC<DocumentCardProps> = ({
    document,
    projectName,
    isProcessing,
    onView,
    onProcess,
    onVerifyOrExport,
    onDelete,
}) => {
    const { can } = usePermissions();
    const fileName = document.originalFileName || document.originalFilename || "Untitled Document";
    const isImage = document.mimeType?.includes("image");
    const isPdf = document.mimeType?.includes("pdf") || fileName?.toLowerCase().endsWith(".pdf");

    const resolvedProjectName =
        projectName ||
        (typeof (document as any).projectId === "object"
            ? (document as any).projectId?.name
            : undefined);

    const statusInfo = statusConfig[document.status] || {
        badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
        label: (document.status?.replaceAll("_", " ") || "UNKNOWN").toUpperCase(),
        dotClass: "bg-slate-400",
    };

    return (
        <div
            onClick={() => onView(document)}
            className="group bg-white rounded-xl border border-slate-200 p-2.5 pt-4 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer h-full"
        >
            <div>
                {/* Header: Icon & Title + Status */}
                <div className="flex items-start gap-3 mb-2">
                    <div
                        className={cn(
                            "w-12 h-12 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105",
                            isPdf
                                ? "bg-red-50 border-red-100/80 text-red-600"
                                : isImage
                                    ? "bg-blue-50 border-blue-100/80 text-blue-600"
                                    : "bg-indigo-50 border-indigo-100/80 text-indigo-600"
                        )}
                    >
                        {isImage ? (
                            <FileImage className="w-9 h-9 text-blue-600" />
                        ) : (
                            <FileText className={cn("w-9 h-9", isPdf ? "text-red-600" : "text-indigo-600")} />
                        )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <h3
                            className="font-medium text-slate-900 text-sm leading-snug line-clamp-1 mb-1.5 truncate group-hover:text-indigo-600 transition-colors"
                            title={fileName}
                        >
                            {fileName}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <Badge className={cn(statusInfo.badgeClass)}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", statusInfo.dotClass)} />
                                {statusInfo.label}
                            </Badge>
                            {resolvedProjectName && (
                                <span
                                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-75"
                                    title={`Project: ${resolvedProjectName}`}
                                >
                                    <Folder className="w-3 h-3 shrink-0 text-slate-400" />
                                    <span className="truncate">{resolvedProjectName}</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Compact Metadata Box */}
                <div className="bg-slate-50/80 border border-slate-100 rounded-lg p-2 flex items-center gap-4 text-xs mb-2">
                    <div className="flex items-center gap-1">
                        <span className="text-slate-400 block font-normal">Type:</span>
                        <span className="font-medium text-slate-700 mt-0.5 block truncate">
                            {getFileType(document.mimeType, fileName)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-slate-400 block font-normal">Size:</span>
                        <span className="font-medium text-slate-700 mt-0.5 block truncate">
                            {formatSize(document.sizeBytes)}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-slate-400 block font-normal">Uploaded:</span>
                        <span className="font-medium text-slate-700 mt-0.5 block truncate" title={formatDate(document.createdAt)}>
                            {formatDate(document.createdAt)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <Button
                    variant="link"
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onView(document);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 group-hover:translate-x-0.5 transition-all cursor-pointer"
                >
                    <Eye className="w-4 h-4" />
                    View Document
                </Button>

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Transform button for UPLOADED */}
                    {document.status === "UPLOADED" && can("verify_documents") && (
                        <Button
                            type="button"
                            title="Transform Document"
                            disabled={isProcessing}
                            onClick={() => onProcess(document._id)}
                            className="text-primary/70 hover:text-primary transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"

                        >
                            {isProcessing ? (
                                <Loader2 className="w-4.5 h-4.5 animate-spin text-indigo-600" />
                            ) : (
                                <Sparkles className="w-4.5 h-4.5" />
                            )}
                        </Button>
                    )}

                    {/* Verify or Export / Download */}
                    {["TRANSFORMED", "VERIFIED", "EXPORTED"].includes(document.status) && (
                        <Button
                            variant="outline"
                            title={
                                document.status === "VERIFIED"
                                    ? "Export Document"
                                    : document.status === "EXPORTED"
                                        ? "Download"
                                        : "Verify Document"
                            }
                            onClick={() => onVerifyOrExport(document._id)}
                            className="text-primary/70 hover:text-primary transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                            size={"icon-sm"}>
                            {document.status === "VERIFIED" || document.status === "EXPORTED" ? (
                                <Download className="w-4.5 h-4.5" />
                            ) : (
                                <FileCheck className="w-4.5 h-4.5" />
                            )}
                        </Button>
                    )}
                    {/* Delete button (gated for OWNER / ADMIN) */}
                    {can("delete_documents") && (
                        <Button
                            variant="outline"
                            onClick={() => onDelete(document._id)}
                            className="text-error hover:text-error transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                            size={"icon-sm"}>
                            <Trash2 className="h-5 w-5 text-error/70 hover:text-error" />
                        </Button>
                    )}
                </div>
            </div>
        </div >
    );
};

export default DocumentCard;
