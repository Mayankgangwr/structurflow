"use client";

import React from "react";
import { BookOpen, ExternalLink, MessageSquare, Zap, Activity } from "lucide-react";
import Link from "next/link";

export const SupportQuickCards: React.FC = () => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3 flex flex-col justify-between hover:border-primary/40 transition-colors">
                <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900 text-sm">Pipeline Documentation</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Detailed technical guides for template schemas, field extraction, and audit trails.
                        </p>
                    </div>
                </div>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline pt-2"
                >
                    <span>Read Developer Docs</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3 flex flex-col justify-between hover:border-primary/40 transition-colors">
                <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Zap className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900 text-sm">REST API Reference</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Programmatically ingest documents, query status, and trigger webhooks.
                        </p>
                    </div>
                </div>
                <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline pt-2"
                >
                    <span>View API Spec</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                </a>
            </div>

            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs space-y-3 flex flex-col justify-between hover:border-primary/40 transition-colors">
                <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900 text-sm">Discord Community</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Collaborate with core maintainers, share custom OCR prompts, and get fast answers.
                        </p>
                    </div>
                </div>
                <a
                    href="https://discord.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline pt-2"
                >
                    <span>Join Discord Server</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                </a>
            </div>
        </div>
    );
};

export default SupportQuickCards;
