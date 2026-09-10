"use client";

import React from "react";
import { Database, Server, Cpu, CheckCircle2, Zap, Sliders, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSystemSettings } from "../hooks/useSystemSettings";

export const SystemStorageSettingsTab: React.FC = () => {
    const {
        confidenceThreshold,
        setConfidenceThreshold,
        autoFlagLowConfidence,
        setAutoFlagLowConfidence,
        strictSchemaValidation,
        setStrictSchemaValidation,
        cacheTtlMinutes,
        setCacheTtlMinutes,
        isSaving,
        handleSaveThresholds,
    } = useSystemSettings();

    return (
        <div className="space-y-6">
            {/* Storage & Service Connectors */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Database className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Storage & Infrastructure Health</h2>
                        <p className="text-xs text-slate-500">Live operational status of backing databases and cloud buckets</p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {/* Supabase Storage */}
                    <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Database className="w-4 h-4 text-emerald-600" />
                                <span className="font-bold text-slate-900 text-sm">Supabase Storage</span>
                            </div>
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Connected
                            </span>
                        </div>
                        <p className="text-slate-500 leading-relaxed">
                            Encrypted S3-compatible document bucket hosting verified PDFs, templates, and raw scan assets.
                        </p>
                        <div className="text-[11px] text-slate-400 font-mono">Bucket: structurflow-docs</div>
                    </div>

                    {/* Redis Cache */}
                    <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Server className="w-4 h-4 text-rose-600" />
                                <span className="font-bold text-slate-900 text-sm">Redis Cluster</span>
                            </div>
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" /> Operational
                            </span>
                        </div>
                        <p className="text-slate-500 leading-relaxed">
                            In-memory caching layer for rate limiting, invitation token lifetimes, and BullMQ background queues.
                        </p>
                        <div className="text-[11px] text-slate-400 font-mono">Mode: Standalone / TTL 3600s</div>
                    </div>

                    {/* Gemini AI Gateway */}
                    <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-600" />
                                <span className="font-bold text-slate-900 text-sm">Gemini AI Model</span>
                            </div>
                            <span className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                                <Zap className="w-3 h-3" /> Online
                            </span>
                        </div>
                        <p className="text-slate-500 leading-relaxed">
                            Multimodal vision extraction model processing OCR recognition, bounding boxes, and JSON transformation.
                        </p>
                        <div className="text-[11px] text-slate-400 font-mono">Model: gemini-2.5-flash</div>
                    </div>
                </div>
            </div>

            {/* Threshold & Processing Rules */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                        <Sliders className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Extraction & Quality Thresholds</h2>
                        <p className="text-xs text-slate-500">Tune automated verification benchmarks and confidence tolerances</p>
                    </div>
                </div>

                <div className="mt-6 space-y-5">
                    {/* Confidence Slider */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-700">Minimum AI Confidence Score</label>
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {confidenceThreshold}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="50"
                            max="98"
                            value={confidenceThreshold}
                            onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <p className="text-[11px] text-slate-400">
                            Documents with an extraction confidence score below this percentage are automatically flagged for Human-in-the-Loop review.
                        </p>
                    </div>

                    {/* Toggle: Auto-flag low confidence */}
                    <div className="flex items-center justify-between py-2 border-t border-slate-100">
                        <div>
                            <span className="text-xs font-semibold text-slate-800 block">Strict Schema Verification</span>
                            <span className="text-[11px] text-slate-500">Enforce exact regex types and required keys before marking documents ready</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={strictSchemaValidation}
                            onChange={(e) => setStrictSchemaValidation(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                        />
                    </div>

                    {/* Toggle: Auto-flag */}
                    <div className="flex items-center justify-between py-2 border-t border-slate-100">
                        <div>
                            <span className="text-xs font-semibold text-slate-800 block">Auto-Flag Flagged Items</span>
                            <span className="text-[11px] text-slate-500">Automatically push documents needing human inspection directly to the Verification Queue</span>
                        </div>
                        <input
                            type="checkbox"
                            checked={autoFlagLowConfidence}
                            onChange={(e) => setAutoFlagLowConfidence(e.target.checked)}
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                        />
                    </div>

                    <div className="pt-2 flex justify-end">
                        <Button
                            onClick={handleSaveThresholds}
                            disabled={isSaving}
                            className="text-xs sm:text-sm font-semibold gap-1.5 py-2 px-4 cursor-pointer"
                        >
                            <Save className="w-4 h-4" />
                            <span>{isSaving ? "Saving..." : "Save System Preferences"}</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemStorageSettingsTab;
