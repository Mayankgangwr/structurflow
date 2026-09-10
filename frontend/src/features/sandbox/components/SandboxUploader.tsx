"use client";

import React, { useRef } from "react";
import {
    UploadCloud,
    CheckCircle2,
    Sparkles,
    FileCode2,
    X,
    FileSpreadsheet,
    ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatSize } from "@/lib/utils";
import toast from "react-hot-toast";

interface SandboxUploaderProps {
    templateFile: File | null;
    onSetTemplateFile: (file: File | null) => void;
    rawDocumentFile: File | null;
    onSetRawDocumentFile: (file: File | null) => void;
    onTransform: () => void;
    isTransforming: boolean;
}

export const SandboxUploader: React.FC<SandboxUploaderProps> = ({
    templateFile,
    onSetTemplateFile,
    rawDocumentFile,
    onSetRawDocumentFile,
    onTransform,
    isTransforming,
}) => {
    const templateInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);

    const handleTemplateDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            validateAndSetTemplate(file);
        }
    };

    const validateAndSetTemplate = (file: File) => {
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
            toast.error("Template must be a PDF file.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Template file size cannot exceed 10 MB.");
            return;
        }
        onSetTemplateFile(file);
    };

    const handleDocumentDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            validateAndSetDoc(file);
        }
    };

    const validateAndSetDoc = (file: File) => {
        const allowedTypes = [
            "application/pdf",
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/webp",
            "text/plain"
        ];
        const isAllowedExt = /\.(pdf|png|jpe?g|webp|txt)$/i.test(file.name);

        if (!allowedTypes.includes(file.type) && !isAllowedExt) {
            toast.error("Please upload a PDF, image (PNG, JPEG, WEBP), or text document.");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Document file size cannot exceed 10 MB.");
            return;
        }
        onSetRawDocumentFile(file);
    };

    const isReady = Boolean(templateFile && rawDocumentFile);

    return (
        <div className="flex flex-col gap-6">
            {/* Top Explanation Banner */}
            <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 border border-indigo-100 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm shadow-primary/30">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900 leading-snug">
                            Instant AI Document Transformation
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-2xl">
                            Upload your formatted <strong className="text-slate-800">Template PDF</strong> and any <strong className="text-slate-800">Raw Document</strong>.
                            Gemini AI will extract, map, and render the transformed PDF directly into memory with <strong className="text-slate-800">zero database storage</strong>.
                        </p>
                    </div>
                </div>
            </div>

            {/* Two-Column Step Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
                {/* 1. Template Uploader */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                                    1
                                </span>
                                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                                    Target Template PDF
                                </h3>
                            </div>
                            <span className="text-xs font-medium text-slate-400">PDF only</span>
                        </div>

                        <input
                            type="file"
                            ref={templateInputRef}
                            accept="application/pdf"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) validateAndSetTemplate(file);
                            }}
                        />

                        {templateFile ? (
                            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                        <FileCode2 className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                            {templateFile.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {formatSize(templateFile.size)} • Target Template
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onSetTemplateFile(null)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                                    title="Remove template"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleTemplateDrop}
                                onClick={() => templateInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5"
                            >
                                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                                    <UploadCloud className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-800">
                                        Upload your Template PDF
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Drag & drop or click to browse (up to 10MB)
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="text-[11px] text-slate-400 mt-4 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Template layout & fields parsed dynamically in volatile RAM
                    </p>
                </div>

                {/* 2. Raw Document Uploader */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center">
                                    2
                                </span>
                                <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                                    Raw Source Document
                                </h3>
                            </div>
                            <span className="text-xs font-medium text-slate-400">PDF, Image, or TXT</span>
                        </div>

                        <input
                            type="file"
                            ref={documentInputRef}
                            accept="application/pdf,image/png,image/jpeg,image/webp,text/plain"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) validateAndSetDoc(file);
                            }}
                        />

                        {rawDocumentFile ? (
                            <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                                        <FileSpreadsheet className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                            {rawDocumentFile.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {formatSize(rawDocumentFile.size)} • Ready for extraction
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onSetRawDocumentFile(null)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                                    title="Remove document"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDocumentDrop}
                                onClick={() => documentInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 hover:border-sky-400 hover:bg-sky-50/30 rounded-xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5"
                            >
                                <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shadow-2xs">
                                    <UploadCloud className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs sm:text-sm font-semibold text-slate-800">
                                        Upload your Raw Document
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        PDF, scan, image, or text file containing values to extract
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="text-[11px] text-slate-400 mt-4 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Processed in volatile RAM and destroyed after generation
                    </p>
                </div>
            </div>

            {/* Transform Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900">
                            Powered by Gemini Multimodal Vision & OCR
                        </p>
                        <p className="text-xs text-slate-500">
                            Automatic field extraction, semantic mapping, and vector PDF compilation.
                        </p>
                    </div>
                </div>

                <Button
                    size="lg"
                    onClick={onTransform}
                    disabled={!isReady || isTransforming}
                    className={cn(
                        "w-full sm:w-auto px-7 font-bold text-sm shadow-md transition-all gap-2 h-11 cursor-pointer",
                        isReady
                            ? "bg-gradient-to-r from-primary via-indigo-600 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                            : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    )}
                >
                    <Sparkles className="w-4 h-4" />
                    <span>{isTransforming ? "Processing with AI..." : "Transform Document Now"}</span>
                    <ArrowRight className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
};
