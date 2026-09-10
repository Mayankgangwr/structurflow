"use client";

import React from "react";
import { CheckCircle2, Zap, Shield, Sparkles } from "lucide-react";

export const SupportSystemHealthCard: React.FC = () => {
    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-sm font-bold text-slate-900">System Operational Status</h2>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    All Systems 99.98%
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block">AI Ingestion API</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">Operational</span>
                    <span className="text-[10px] text-emerald-600 mt-1 block">99.99% Uptime</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block">Gemini 3.5 Gateway</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">Normal</span>
                    <span className="text-[10px] text-emerald-600 mt-1 block">~1.2s avg latency</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block">Supabase Storage</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">Online</span>
                    <span className="text-[10px] text-emerald-600 mt-1 block">S3 US-East</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-500 block">Redis Job Queue</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">Healthy</span>
                    <span className="text-[10px] text-emerald-600 mt-1 block">0 backpressure</span>
                </div>
            </div>
        </div>
    );
};

export default SupportSystemHealthCard;
