"use client";

import React from "react";
import { Document } from "@/features/documents/documentApi";
import { cn, formatDate, formatSize, getFileType } from "@/lib/utils";
import {
    FileText,
    FileImage,
    Folder,
    Check,
    X,
    Eye,
    Loader2,
    Calendar,
    Tag,
    ChevronRight,
    Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    normalizeExtractedFields,
    getPreviewFields,
} from "../utils/extractedFields";
import { usePermissions } from "@/features/auth/hooks/usePermissions";

export interface VerificationCardProps {
    document: Document & { projectId?: { _id: string; name: string } | string };
    isSelected?: boolean;
    onToggleSelect?: (id: string) => void;
    onReview: (document: Document) => void;
    onQuickApprove: (documentId: string) => void;
    onReject: (document: Document) => void;
    isProcessing?: boolean;
}

const statusBadgeStyles: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    TRANSFORMED: {
        bg: "bg-amber-50 border-amber-200/90",
        text: "text-amber-800 font-semibold",
        dot: "bg-amber-500 animate-pulse",
        label: "Ready for Review",
    },
    REVIEW_REQUIRED: {
        bg: "bg-rose-50 border-rose-200/90",
        text: "text-rose-800 font-semibold",
        dot: "bg-rose-500 animate-pulse",
        label: "Attention Needed",
    },
    VERIFIED: {
        bg: "bg-emerald-50 border-emerald-200/90",
        text: "text-emerald-800 font-semibold",
        dot: "bg-emerald-500",
        label: "Verified",
    },
    EXPORTED: {
        bg: "bg-teal-50 border-teal-200/90",
        text: "text-teal-800 font-semibold",
        dot: "bg-teal-500",
        label: "Exported",
    },
    REJECTED: {
        bg: "bg-rose-50 border-rose-200/90",
        text: "text-rose-800 font-semibold",
        dot: "bg-rose-500",
        label: "Rejected",
    },
    FAILED: {
        bg: "bg-rose-50 border-rose-200/90",
        text: "text-rose-800 font-semibold",
        dot: "bg-rose-500",
        label: "Failed",
    },
};

const VerificationCard: React.FC<VerificationCardProps> = ({
    document,
    isSelected = false,
    onToggleSelect,
    onReview,
    onQuickApprove,
    onReject,
    isProcessing = false,
}) => {
    const { can } = usePermissions();
    const canVerify = can("verify_documents");
    const fileName = document.originalFileName || document.originalFilename;
    const isImage = document.mimeType?.includes("image");
    const isPdf = document.mimeType?.includes("pdf") || fileName?.toLowerCase().endsWith(".pdf");

    const resolvedProjectName =
        typeof (document as any).projectId === "object"
            ? (document as any).projectId?.name
            : undefined;

    const statusInfo = statusBadgeStyles[document.status] || {
        bg: "bg-slate-100 border-slate-200",
        text: "text-slate-700 font-semibold",
        dot: "bg-slate-400",
        label: document.status?.replaceAll("_", " ") || "UNKNOWN",
    };

    // Normalize AI-extracted fields safely whether array or key-value object
    const rawAiData = document.processingDetails?.aiResponse?.data;
    const normalizedFields = React.useMemo(
        () => normalizeExtractedFields(rawAiData),
        [rawAiData]
    );
    const totalFieldsCount = normalizedFields.length;
    const previewFields = React.useMemo(
        () => getPreviewFields(normalizedFields, 2),
        [normalizedFields]
    );
    const remainingFieldsCount = Math.max(0, totalFieldsCount - previewFields.length);

    return (
        <div
            onClick={() => onReview(document)}
            className={cn(
                "group bg-white rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer h-full relative shadow-xs hover:shadow-md hover:-translate-y-0.5",
                isSelected
                    ? "border-amber-500 ring-2 ring-amber-500/20 shadow-sm bg-amber-50/10"
                    : "border-slate-200/80 hover:border-amber-400/60"
            )}
        >
            <div className="space-y-3">
                {/* Top Row: Checkbox + Icon + Filename + Badges */}
                <div className="flex items-start gap-3">
                    {/* Checkbox (gated for operators with verification permissions) */}
                    {canVerify && onToggleSelect && (
                        <div
                            className="pt-1 shrink-0"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleSelect(document._id);
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => onToggleSelect(document._id)}
                                className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/20 cursor-pointer transition-colors"
                            />
                        </div>
                    )}

                    {/* File Format Icon */}
                    <div
                        className={cn(
                            "w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-105",
                            isPdf
                                ? "bg-gradient-to-br from-rose-50 to-red-100/70 border-red-200/70 text-red-600"
                                : isImage
                                    ? "bg-gradient-to-br from-blue-50 to-indigo-100/70 border-blue-200/70 text-blue-600"
                                    : "bg-gradient-to-br from-amber-50 to-amber-100/70 border-amber-200/70 text-amber-600"
                        )}
                    >
                        {isImage ? (
                            <FileImage className="w-5.5 h-5.5 text-blue-600" />
                        ) : (
                            <FileText className={cn("w-5.5 h-5.5", isPdf ? "text-red-600" : "text-amber-600")} />
                        )}
                    </div>

                    {/* Title + Status Badges */}
                    <div className="flex flex-col min-w-0 flex-1">
                        <h3
                            className="font-semibold text-slate-900 text-sm leading-snug truncate group-hover:text-primary transition-colors"
                            title={fileName}
                        >
                            {fileName}
                        </h3>

                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[11px] font-semibold border px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-2xs",
                                    statusInfo.bg,
                                    statusInfo.text
                                )}
                            >
                                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusInfo.dot)} />
                                <span>{statusInfo.label}</span>
                            </Badge>

                            {resolvedProjectName && (
                                <span
                                    className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium bg-slate-100/90 border border-slate-200/60 px-2 py-0.5 rounded-full truncate max-w-36 shadow-2xs"
                                    title={`Project: ${resolvedProjectName}`}
                                >
                                    <Folder className="w-3 h-3 shrink-0 text-slate-400" />
                                    <span className="truncate">{resolvedProjectName}</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Extracted Data Highlights (Reviewer Focus) */}
                <div className="bg-gradient-to-b from-amber-50/70 via-amber-50/40 to-white/90 border border-amber-200/70 rounded-xl p-3 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-amber-950">
                        <span className="flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-amber-600" />
                            <span>Extracted Fields</span>
                        </span>
                        {totalFieldsCount > 0 && (
                            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/90 border border-amber-200/80 px-2 py-0.5 rounded-full shadow-2xs">
                                {totalFieldsCount} fields
                            </span>
                        )}
                    </div>

                    {previewFields.length > 0 ? (
                        <div className="space-y-1.5">
                            {previewFields.map((field) => (
                                <div
                                    key={field.id}
                                    className="flex items-center justify-between gap-2 text-xs py-0.5"
                                >
                                    <span
                                        className="text-slate-500 text-[11px] font-medium truncate max-w-[130px]"
                                        title={field.label}
                                    >
                                        {field.label}:
                                    </span>
                                    <span
                                        className={cn(
                                            "font-mono text-xs font-semibold truncate max-w-[170px] text-right px-2 py-0.5 rounded border shadow-2xs",
                                            field.hasValue
                                                ? "text-slate-900 bg-white/90 border-slate-200/70"
                                                : "text-slate-400 bg-slate-50 border-dashed border-slate-200 italic font-normal"
                                        )}
                                        title={field.value || "Empty"}
                                    >
                                        {field.value || "—"}
                                    </span>
                                </div>
                            ))}

                            {remainingFieldsCount > 0 && (
                                <div className="pt-1 border-t border-amber-100 flex items-center justify-between text-[11px] text-amber-700 font-medium">
                                    <span className="flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-amber-500" />
                                        <span>+{remainingFieldsCount} more fields in workbench</span>
                                    </span>
                                    <ChevronRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-[11px] text-slate-400 italic py-1">
                            No structured fields extracted yet
                        </p>
                    )}
                </div>

                {/* Metadata Row: File Type, Size, Upload Date */}
                <div className="bg-slate-50/80 border border-slate-100/90 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-[11px] text-slate-600">
                        {getFileType(document.mimeType, fileName)} • {formatSize(document.sizeBytes)}
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDate(document.createdAt)}
                    </span>
                </div>
            </div>

            {/* Footer Action Bar */}
            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Button
                    variant="link"
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onReview(document);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-container group-hover:translate-x-0.5 transition-all p-0 h-auto cursor-pointer"
                >
                    <Eye className="w-4 h-4" />
                    <span>Review Document</span>
                </Button>

                {canVerify && (
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {/* Quick Approve Button */}
                        {document.status !== "VERIFIED" && document.status !== "EXPORTED" && (
                            <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => onQuickApprove(document._id)}
                                className="w-8 h-8 rounded-lg border border-emerald-200/90 bg-emerald-50/80 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-150 shadow-2xs flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Quick Approve (1-click sign-off)"
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                                ) : (
                                    <Check className="w-4 h-4 stroke-[2.5]" />
                                )}
                            </button>
                        )}

                        {/* Reject Button */}
                        {document.status !== "REJECTED" && (
                            <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => onReject(document)}
                                className="w-8 h-8 rounded-lg border border-rose-200/90 bg-rose-50/80 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all duration-150 shadow-2xs flex items-center justify-center cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Reject / Flag document"
                            >
                                <X className="w-4 h-4 stroke-[2.5]" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerificationCard;
