"use client";

import React, { useState, useEffect } from "react";
import { Document, useGetDocumentPreviewQuery, useGetDocumentByIdQuery, useProcessDocumentMutation } from "@/features/documents/documentApi";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PdfViewer from "@/components/ui/pdf-viewer";
import {
    Check,
    X,
    ChevronLeft,
    ChevronRight,
    Loader2,
    ExternalLink,
    FileText,
    Copy,
    CheckCircle2,
    Sparkles,
    Folder,
    Code,
    FileCheck2,
    AlertTriangle,
    Eye
} from "lucide-react";
import { cn, formatSize, getFileType } from "@/lib/utils";
import toast from "react-hot-toast";
import { normalizeExtractedFields, ExtractedFieldItem } from "../utils/extractedFields";

export interface VerificationWorkbenchModalProps {
    isOpen: boolean;
    onClose: () => void;
    document: Document | null;
    currentIndex: number;
    totalInQueue: number;
    onPrevious: () => void;
    onNext: () => void;
    onApprove: (documentId: string) => Promise<void>;
    onReject: (documentId: string, reason?: string) => Promise<void>;
    isApproving?: boolean;
    isRejecting?: boolean;
}

const VerificationWorkbenchModal: React.FC<VerificationWorkbenchModalProps> = ({
    isOpen,
    onClose,
    document,
    currentIndex,
    totalInQueue,
    onPrevious,
    onNext,
    onApprove,
    onReject,
    isApproving = false,
    isRejecting = false,
}) => {
    const [activeTab, setActiveTab] = useState<"fields" | "preview" | "json">("fields");
    const [fieldSearch, setFieldSearch] = useState("");
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState("");

    const [processDocumentMutation, { isLoading: isReprocessing }] = useProcessDocumentMutation();

    // Query full document details (includes audit trail)
    const { data: docDetailsRes } = useGetDocumentByIdQuery(document?._id || "", {
        skip: !isOpen || !document?._id,
    });

    // Query transformed document preview PDF
    const { data: previewRes, isLoading: isPreviewLoading } = useGetDocumentPreviewQuery(document?._id || "", {
        skip: !isOpen || !document?._id || activeTab !== "preview",
    });

    // Keyboard navigation (Esc to close, Arrow keys for prev/next)
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isRejectDialogOpen) {
                onClose();
            } else if (e.key === "ArrowLeft" && currentIndex > 0) {
                onPrevious();
            } else if (e.key === "ArrowRight" && currentIndex < totalInQueue - 1) {
                onNext();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, isRejectDialogOpen, currentIndex, totalInQueue, onPrevious, onNext, onClose]);

    if (!isOpen || !document) return null;

    const fileName = document.originalFileName || document.originalFilename;
    const isPdf = document.mimeType?.includes("pdf") || fileName?.toLowerCase().endsWith(".pdf");
    const isImage = document.mimeType?.includes("image");

    const projectName =
        typeof (document as any).projectId === "object"
            ? (document as any).projectId?.name
            : "Assigned Project";

    const rawAiData = document.processingDetails?.aiResponse?.data || docDetailsRes?.data?.document?.processingDetails?.aiResponse?.data;
    const extractedFields: ExtractedFieldItem[] = React.useMemo(() => normalizeExtractedFields(rawAiData), [rawAiData]);

    const filteredFields = extractedFields.filter((field) => {
        if (!fieldSearch.trim()) return true;
        const search = fieldSearch.toLowerCase();
        return (
            field.label.toLowerCase().includes(search) ||
            field.key.toLowerCase().includes(search) ||
            field.value.toLowerCase().includes(search)
        );
    });

    const handleCopy = (key: string, value: string) => {
        navigator.clipboard.writeText(value);
        setCopiedField(key);
        toast.success(`Copied "${key}" value`);
        setTimeout(() => setCopiedField(null), 1500);
    };

    const handleApproveAndNext = async () => {
        if (!document) return;
        await onApprove(document._id);
    };

    const handleConfirmReject = async () => {
        if (!document) return;
        await onReject(document._id, rejectionReason);
        setIsRejectDialogOpen(false);
        setRejectionReason("");
    };

    const handleReprocess = async () => {
        if (!document) return;
        try {
            await processDocumentMutation({ documentId: document._id }).unwrap();
            toast.success("Document sent for AI re-processing");
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to re-process document");
        }
    };

    const transformedPdfUrl = typeof previewRes?.data?.url === "string" ? previewRes.data.url : "";

    return (
        <>
            <Dialog
                open={isOpen}
                onClose={onClose}
                size="xl"
                className="max-w-[96vw] sm:max-w-7xl w-full"
                title=""
                contentClassName="p-0 overflow-hidden flex flex-col h-[92vh] mx-auto rounded-2xl bg-white border border-slate-200/80 shadow-2xl"
            >
                {/* Header Bar */}
                <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h2 className="font-semibold text-slate-900 text-sm sm:text-base leading-tight truncate max-w-md" title={fileName}>
                                    {fileName}
                                </h2>
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded-md">
                                    <Folder className="w-3 h-3 text-slate-400" />
                                    <span className="truncate max-w-36">{projectName}</span>
                                </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>{getFileType(document.mimeType, fileName)}</span>
                                <span>•</span>
                                <span>{formatSize(document.sizeBytes)}</span>
                            </p>
                        </div>
                    </div>

                    {/* Queue Navigation & Controls */}
                    <div className="flex items-center gap-2 shrink-0">
                        {totalInQueue > 1 && (
                            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    disabled={currentIndex <= 0}
                                    onClick={onPrevious}
                                    className="h-7 w-7 text-slate-600 disabled:opacity-30 cursor-pointer"
                                    title="Previous document (Left arrow)"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="text-xs font-semibold px-2 text-slate-600">
                                    {currentIndex + 1} / {totalInQueue}
                                </span>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    disabled={currentIndex >= totalInQueue - 1}
                                    onClick={onNext}
                                    className="h-7 w-7 text-slate-600 disabled:opacity-30 cursor-pointer"
                                    title="Next document (Right arrow)"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(document.secureUrl, "_blank")}
                            className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 border-slate-200 h-8"
                            title="Open original file in new window"
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Raw File</span>
                        </Button>

                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                            title="Close (Esc)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Main Dual-Pane Body */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-hidden">
                    {/* LEFT PANE: Original Document Viewer */}
                    <div className="flex flex-col h-full overflow-hidden bg-slate-100/50">
                        <div className="px-4 py-2 border-b border-slate-200 bg-white/70 flex items-center justify-between text-xs text-slate-500 shrink-0">
                            <span className="font-semibold text-slate-700">Source Document</span>
                            <span className="text-[11px] text-slate-400">High-resolution viewer</span>
                        </div>
                        <div className="flex-1 overflow-hidden p-2 flex items-center justify-center">
                            {isPdf ? (
                                <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200 bg-white shadow-xs">
                                    <PdfViewer
                                        src={document.secureUrl}
                                        title={fileName}
                                        fitMode="FitH"
                                        showToolbar={false}
                                    />
                                </div>
                            ) : isImage ? (
                                <div className="w-full h-full overflow-auto flex items-center justify-center p-4 bg-slate-900/5 rounded-lg">
                                    <img
                                        src={document.secureUrl}
                                        alt={fileName}
                                        className="max-h-full max-w-full object-contain rounded-md shadow-md"
                                    />
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-500">
                                    <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                                    <p className="text-sm font-medium">Preview not available for this format</p>
                                    <a
                                        href={document.secureUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-primary text-xs font-semibold hover:underline mt-2"
                                    >
                                        Download original file <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANE: Extracted Schema, Form & Output */}
                    <div className="flex flex-col h-full overflow-hidden bg-white">
                        {/* Tab Switcher */}
                        <div className="px-4 py-2 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between gap-2 shrink-0">
                            <div className="flex items-center gap-1 p-0.5 bg-slate-200/60 rounded-lg">
                                <button
                                    onClick={() => setActiveTab("fields")}
                                    className={cn(
                                        "px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                                        activeTab === "fields"
                                            ? "bg-white text-slate-900 shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    )}
                                >
                                    <FileCheck2 className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Extracted Data ({extractedFields.length})</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("preview")}
                                    className={cn(
                                        "px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                                        activeTab === "preview"
                                            ? "bg-white text-slate-900 shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    )}
                                >
                                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                                    <span>Transformed PDF</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab("json")}
                                    className={cn(
                                        "px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                                        activeTab === "json"
                                            ? "bg-white text-slate-900 shadow-xs"
                                            : "text-slate-600 hover:text-slate-900"
                                    )}
                                >
                                    <Code className="w-3.5 h-3.5 text-slate-500" />
                                    <span>JSON</span>
                                </button>
                            </div>

                            {activeTab === "fields" && extractedFields.length > 5 && (
                                <input
                                    type="text"
                                    value={fieldSearch}
                                    onChange={(e) => setFieldSearch(e.target.value)}
                                    placeholder="Filter fields..."
                                    className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-md max-w-36 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                            )}
                        </div>

                        {/* Tab Content Area */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                            {activeTab === "fields" && (
                                extractedFields.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400">
                                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                                        <p className="text-sm font-medium text-slate-700">No extracted fields available</p>
                                        <p className="text-xs mt-1">This document may still be processing or failed extraction.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {filteredFields.map((field) => {
                                            const isCopied = copiedField === field.key;

                                            return (
                                                <div
                                                    key={field.id}
                                                    className="p-3.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-xl transition-all group"
                                                >
                                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                            <span className="text-xs font-bold text-slate-800 tracking-tight">
                                                                {field.label}
                                                            </span>
                                                            {field.required && (
                                                                <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200/80 px-1.5 py-0.2 rounded shadow-2xs">
                                                                    Required
                                                                </span>
                                                            )}
                                                            {field.type && (
                                                                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200/80 px-1.5 py-0.2 rounded uppercase">
                                                                    {field.type}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-1.5 shrink-0">
                                                            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline" title="Schema key">
                                                                {field.key}
                                                            </span>
                                                            <button
                                                                onClick={() => handleCopy(field.key, field.value)}
                                                                className="text-slate-400 hover:text-slate-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded hover:bg-slate-200/50"
                                                                title={`Copy ${field.label}`}
                                                            >
                                                                {isCopied ? (
                                                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                                ) : (
                                                                    <Copy className="w-3.5 h-3.5" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="text-sm font-medium text-slate-900 break-words whitespace-pre-wrap font-mono bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                                                        {field.value || <span className="text-slate-300 italic font-sans font-normal">Not extracted</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )
                            )}

                            {activeTab === "preview" && (
                                isPreviewLoading ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                                        <p className="text-xs">Rendering transformed output preview...</p>
                                    </div>
                                ) : transformedPdfUrl ? (
                                    <div className="w-full h-full min-h-[500px] rounded-lg overflow-hidden border border-slate-200 bg-white">
                                        <PdfViewer
                                            src={transformedPdfUrl}
                                            title="Transformed PDF Preview"
                                            fitMode="FitH"
                                            showToolbar={false}
                                        />
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-slate-400">
                                        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                        <p className="text-xs">No transformed PDF preview generated yet.</p>
                                    </div>
                                )
                            )}

                            {activeTab === "json" && (
                                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-auto max-h-[550px] shadow-inner">
                                    <pre>{JSON.stringify(rawAiData || {}, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Action Bar */}
                <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isRejecting || isApproving}
                            onClick={() => setIsRejectDialogOpen(true)}
                            className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 text-xs font-semibold cursor-pointer h-9 px-3"
                        >
                            <X className="w-4 h-4 mr-1" />
                            Reject Document
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isReprocessing || isApproving}
                            onClick={handleReprocess}
                            className="text-slate-600 border-slate-200 hover:bg-slate-100 text-xs font-semibold cursor-pointer h-9 px-3"
                            title="Re-run AI extraction pipeline"
                        >
                            {isReprocessing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                            ) : (
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
                            )}
                            Re-process
                        </Button>
                    </div>

                    <div className="flex items-center gap-2 justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClose}
                            className="text-xs text-slate-600 h-9 px-3 cursor-pointer"
                        >
                            Close
                        </Button>

                        {/* APPROVE & NEXT Primary Action */}
                        <Button
                            size="sm"
                            disabled={isApproving || isRejecting}
                            onClick={handleApproveAndNext}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
                        >
                            {isApproving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>
                                        {currentIndex < totalInQueue - 1 ? "Approve & Next" : "Approve & Finish"}
                                    </span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Dialog>

            {/* Rejection Reason Mini-Modal */}
            {isRejectDialogOpen && (
                <Dialog
                    open={isRejectDialogOpen}
                    onClose={() => setIsRejectDialogOpen(false)}
                    title="Reject Document"
                    className="max-w-md"
                    footer={
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsRejectDialogOpen(false)}
                                disabled={isRejecting}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleConfirmReject}
                                disabled={isRejecting}
                                className="bg-rose-600 hover:bg-rose-700 text-white"
                            >
                                {isRejecting ? "Rejecting..." : "Confirm Rejection"}
                            </Button>
                        </div>
                    }
                >
                    <div className="p-4 space-y-3">
                        <p className="text-xs text-slate-600">
                            Please provide an optional reason for flagging or rejecting{" "}
                            <span className="font-semibold text-slate-900">{fileName}</span>:
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="e.g., Unreadable scan, incorrect invoice total, missing pages..."
                            rows={3}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                        />
                    </div>
                </Dialog>
            )}
        </>
    );
};

export default VerificationWorkbenchModal;
