"use client";

import React, { useState, useEffect } from "react";
import { SandboxHeader } from "./SandboxHeader";
import { SandboxUploader } from "./SandboxUploader";
import { SandboxResultViewer } from "./SandboxResultViewer";
import {
    useTransformSandboxDocumentMutation,
    SandboxTransformResponse
} from "../sandboxApi";
import {
    Loader2,
    Shield
} from "lucide-react";
import toast from "react-hot-toast";

export const SandboxWorkspace: React.FC = () => {
    const [templateFile, setTemplateFile] = useState<File | null>(null);
    const [rawDocumentFile, setRawDocumentFile] = useState<File | null>(null);
    const [transformResult, setTransformResult] = useState<SandboxTransformResponse | null>(null);

    // Processing step animation (1: Intake, 2: Gemini OCR & mapping, 3: PDF Generation)
    const [processingStep, setProcessingStep] = useState<number>(0);

    const [transformMutation, { isLoading: isTransforming }] = useTransformSandboxDocumentMutation();

    useEffect(() => {
        let interval: any;
        if (isTransforming) {
            setProcessingStep(1);
            interval = setInterval(() => {
                setProcessingStep((prev) => {
                    if (prev < 3) return prev + 1;
                    return prev;
                });
            }, 1800);
        } else {
            setProcessingStep(0);
        }
        return () => clearInterval(interval);
    }, [isTransforming]);

    const handleTransform = async () => {
        if (!templateFile) {
            toast.error("Please upload a target template PDF.");
            return;
        }
        if (!rawDocumentFile) {
            toast.error("Please upload a raw document to extract.");
            return;
        }

        const formData = new FormData();
        formData.append("template", templateFile);
        formData.append("document", rawDocumentFile);

        try {
            const res = await transformMutation(formData).unwrap();
            if (res.success && res.data) {
                setTransformResult(res.data);
                toast.success("Document transformed successfully!");
            }
        } catch (err: any) {
            const errorMsg =
                err?.data?.message ||
                err?.message ||
                "Failed to transform document. Please verify the template is a valid PDF and try again.";
            toast.error(errorMsg);
        }
    };

    const handleReset = () => {
        setTransformResult(null);
        setRawDocumentFile(null);
        setTemplateFile(null);
    };

    return (
        <div className="min-h-screen bg-slate-50/70 flex flex-col">
            {/* 1. Global Minimal Header */}
            <SandboxHeader />

            {/* 2. Main Container */}
            <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-6">
                {isTransforming ? (
                    /* In-flight Processing Overlay Stepper */
                    <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
                        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-lg p-6 sm:p-8 flex flex-col items-center text-center">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-primary mb-5 shadow-xs">
                                <Loader2 className="w-7 h-7 animate-spin text-primary" />
                            </div>

                            <h3 className="text-lg font-bold text-slate-900">
                                Transforming Document
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs">
                                Running in volatile memory with zero database persistence...
                            </p>

                            {/* Stepper Progress */}
                            <div className="w-full mt-6 space-y-3">
                                <div
                                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                        processingStep >= 1
                                            ? "bg-indigo-50/80 border-indigo-200 text-indigo-900"
                                            : "bg-slate-50 border-slate-200 text-slate-400"
                                    }`}
                                >
                                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                                        1
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold">
                                            Parsing Template & Document in RAM
                                        </p>
                                        <p className="text-[11px] opacity-75">
                                            Extracting visual coordinates and layout AST
                                        </p>
                                    </div>
                                </div>

                                <div
                                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                        processingStep >= 2
                                            ? "bg-purple-50/80 border-purple-200 text-purple-900"
                                            : "bg-slate-50 border-slate-200 text-slate-400"
                                    }`}
                                >
                                    <div
                                        className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 ${
                                            processingStep >= 2 ? "bg-purple-600" : "bg-slate-300"
                                        }`}
                                    >
                                        2
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold">
                                            Gemini AI Vision & Schema Mapping
                                        </p>
                                        <p className="text-[11px] opacity-75">
                                            Mapping unstructured content to template fields
                                        </p>
                                    </div>
                                </div>

                                <div
                                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                                        processingStep >= 3
                                            ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                                            : "bg-slate-50 border-slate-200 text-slate-400"
                                    }`}
                                >
                                    <div
                                        className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 ${
                                            processingStep >= 3 ? "bg-emerald-600" : "bg-slate-300"
                                        }`}
                                    >
                                        3
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold">
                                            Compiling Vector PDF Output
                                        </p>
                                        <p className="text-[11px] opacity-75">
                                            Hydrating final transformed document buffer
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : transformResult ? (
                    /* Completed Result View */
                    <SandboxResultViewer
                        result={transformResult}
                        onReset={handleReset}
                    />
                ) : (
                    /* Clean Uploader State */
                    <SandboxUploader
                        templateFile={templateFile}
                        onSetTemplateFile={setTemplateFile}
                        rawDocumentFile={rawDocumentFile}
                        onSetRawDocumentFile={setRawDocumentFile}
                        onTransform={handleTransform}
                        isTransforming={isTransforming}
                    />
                )}
            </main>

            {/* 3. Minimal Footer with Zero-Retention Guarantee */}
            <footer className="w-full border-t border-slate-200/80 bg-white py-6 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-emerald-600" />
                        <span>
                            <strong>Zero-Storage Guarantee:</strong> Files exist strictly in RAM during request processing and are never written to database or cloud storage.
                        </span>
                    </div>

                    <p>© 2026 StructurFlow. Built for intelligent, privacy-first document automation.</p>
                </div>
            </footer>
        </div>
    );
};

export default SandboxWorkspace;
