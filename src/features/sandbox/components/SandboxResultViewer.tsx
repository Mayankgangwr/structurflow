"use client";

import React, { useState } from "react";
import {
    Download,
    FileText,
    Code,
    CheckCircle2,
    RotateCcw,
    Sparkles,
    Copy,
    Check,
    Clock,
    FileCheck2,
    Shield,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PdfViewer from "@/components/ui/pdf-viewer";
import { SandboxTransformResponse } from "../sandboxApi";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";

interface SandboxResultViewerProps {
    result: SandboxTransformResponse;
    onReset: () => void;
}

export const SandboxResultViewer: React.FC<SandboxResultViewerProps> = ({
    result,
    onReset,
}) => {
    const [activeTab, setActiveTab] = useState<"pdf" | "json">("pdf");
    const [copiedJson, setCopiedJson] = useState(false);

    // Trigger PDF download from Base64
    const handleDownloadPdf = () => {
        try {
            const byteCharacters = atob(result.pdfBase64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = result.filename || "StructurFlow_Transformed_Document.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Transformed PDF downloaded successfully!");
        } catch (err: any) {
            toast.error("Failed to download PDF: " + err.message);
        }
    };

    // Trigger JSON download
    const handleDownloadJson = () => {
        try {
            const jsonStr = JSON.stringify(result.extractedFields, null, 2);
            const blob = new Blob([jsonStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `${result.filename.replace(/\.pdf$/i, "")}_data.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Extracted JSON data exported!");
        } catch (err: any) {
            toast.error("Failed to export JSON: " + err.message);
        }
    };

    const handleCopyJson = () => {
        navigator.clipboard.writeText(JSON.stringify(result.extractedFields, null, 2));
        setCopiedJson(true);
        toast.success("JSON copied to clipboard!");
        setTimeout(() => setCopiedJson(false), 2000);
    };

    const pdfDataUrl = `data:application/pdf;base64,${result.pdfBase64}`;
    const fieldCount = Object.keys(result.extractedFields || {}).length;

    return (
        <div className="flex flex-col gap-6">
            {/* Top Success Banner & Action Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/20">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-bold text-slate-900 leading-snug">
                                Transformation Complete
                            </h2>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <Shield className="w-3 h-3" />
                                0 Database Records Stored
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {(result.processingTimeMs / 1000).toFixed(2)}s processing time
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <FileCheck2 className="w-3.5 h-3.5 text-slate-400" />
                                {fieldCount} fields extracted
                            </span>
                        </p>
                    </div>
                </div>

                {/* Primary Download & Reset Actions */}
                <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onReset}
                        className="text-xs text-slate-600 hover:text-slate-900 border-slate-200 gap-1.5 cursor-pointer"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Transform Another</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadJson}
                        className="text-xs text-slate-600 hover:text-slate-900 border-slate-200 gap-1.5 cursor-pointer"
                    >
                        <Code className="w-3.5 h-3.5" />
                        <span>Export JSON</span>
                    </Button>

                    <Button
                        size="sm"
                        onClick={handleDownloadPdf}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer"
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Transformed PDF</span>
                    </Button>
                </div>
            </div>

            {/* Viewer Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col h-[75vh]">
                {/* View Tabs */}
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-lg text-xs">
                        <button
                            type="button"
                            onClick={() => setActiveTab("pdf")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer",
                                activeTab === "pdf"
                                    ? "bg-white text-slate-900 shadow-2xs"
                                    : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Transformed PDF Preview</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab("json")}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer",
                                activeTab === "json"
                                    ? "bg-white text-slate-900 shadow-2xs"
                                    : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            <Code className="w-3.5 h-3.5" />
                            <span>Extracted Schema JSON ({fieldCount})</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {activeTab === "json" && (
                            <button
                                type="button"
                                onClick={handleCopyJson}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                            >
                                {copiedJson ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy JSON</span>
                                    </>
                                )}
                            </button>
                        )}
                        <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
                            {result.filename}
                        </span>
                    </div>
                </div>

                {/* Body Content */}
                <div className="flex-1 min-h-0 bg-slate-100/60 p-2 sm:p-4">
                    {activeTab === "pdf" ? (
                        <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
                            <PdfViewer
                                src={pdfDataUrl}
                                title={result.filename}
                                className="w-full h-full"
                                showToolbar={true}
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full rounded-xl overflow-auto border border-slate-200 bg-slate-900 text-slate-100 p-4 font-mono text-xs shadow-inner">
                            <pre className="leading-relaxed">
                                {JSON.stringify(result.extractedFields, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Conversion & Privacy Banner */}
            <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/80 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/30">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 text-sm">
                            Need bulk automation, custom templates, and team review?
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Create a free StructurFlow workspace to save custom reusable templates, audit trails, and automated webhooks.
                        </p>
                    </div>
                </div>

                <Link href="/register" className="shrink-0 w-full sm:w-auto">
                    <Button className="w-full sm:w-auto text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 shadow-xs">
                        <span>Get Started Free</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                </Link>
            </div>
        </div>
    );
};
