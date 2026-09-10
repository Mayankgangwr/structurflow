import React from "react";
import Link from "next/link";
import {
    Sparkles,
    Shield,
    ArrowRight,
    Zap,
    FileCheck2,
    FileSpreadsheet,
    Lock,
    CheckCircle2,
    Cpu,
    UploadCloud
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
            {/* 1. Header Navigation */}
            <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-primary to-indigo-700 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-lg text-white tracking-tight">
                            Structur<span className="text-indigo-400">Flow</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/sandbox">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs bg-slate-900/80 border-indigo-500/30 text-indigo-300 hover:text-white hover:bg-indigo-950/50 gap-1.5"
                            >
                                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                <span>Guest Sandbox (No Login)</span>
                            </Button>
                        </Link>
                        <Link href="/login">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                            >
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button
                                size="sm"
                                className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold gap-1 shadow-sm shadow-indigo-600/30"
                            >
                                <span>Get Started</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* 2. Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 max-w-5xl mx-auto text-center">
                {/* Ephemeral Pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-950/80 border border-indigo-800/80 text-indigo-300 mb-6 shadow-inner">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>New: Zero-Retention Instant Sandbox Mode</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.15]">
                    Transform Unstructured Docs Into Structured PDFs{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400">
                        In Seconds.
                    </span>
                </h1>

                <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
                    Powered by Gemini Vision OCR and vector layout AST synthesis. Extract data from raw
                    resumes, invoices, and contracts—and format them into standardized templates instantly.
                </p>

                {/* Primary Action Buttons */}
                <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <Link href="/sandbox" className="w-full sm:w-auto">
                        <Button
                            size="lg"
                            className="w-full sm:w-auto px-8 py-6 font-bold text-base bg-gradient-to-r from-indigo-600 via-indigo-500 to-primary hover:from-indigo-500 hover:to-indigo-600 text-white shadow-lg shadow-indigo-600/30 gap-2 cursor-pointer hover:-translate-y-0.5 transition-all"
                        >
                            <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
                            <span>Try Without Login (Instant Sandbox)</span>
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </Link>

                    <Link href="/register" className="w-full sm:w-auto">
                        <Button
                            size="lg"
                            variant="outline"
                            className="w-full sm:w-auto px-8 py-6 font-semibold text-base border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-white gap-2 cursor-pointer"
                        >
                            <span>Create Free Workspace</span>
                        </Button>
                    </Link>
                </div>

                {/* Trust Points */}
                <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>No Credit Card or Login Required</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-indigo-400" />
                        <span>Zero Data Retention in Sandbox</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-sky-400" />
                        <span>In-Memory PDF Generation</span>
                    </div>
                </div>

                {/* Feature Highlights Grid */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-5 text-left w-full">
                    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-800 text-indigo-400 flex items-center justify-center mb-4">
                                <Cpu className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-white text-base">Gemini Multimodal AI</h3>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                                Advanced OCR and semantic NLP to extract complex tabular items, dates, and currency values.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-800 text-sky-400 flex items-center justify-center mb-4">
                                <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-white text-base">Pixel-Perfect Hydration</h3>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                                Compiles extracted data directly into vector PDF templates preserving font styling, margins, and layout.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mb-4">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h3 className="font-bold text-white text-base">Privacy & Ephemeral</h3>
                            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                                Sandbox mode operates purely in volatile RAM. No database records, no cloud storage, no history saved.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {/* 3. Footer */}
            <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p>© 2026 StructurFlow. Intelligent document processing pipelines.</p>
                    <div className="flex items-center gap-4">
                        <Link href="/sandbox" className="hover:text-slate-300 transition-colors">
                            Guest Sandbox
                        </Link>
                        <Link href="/login" className="hover:text-slate-300 transition-colors">
                            Sign In
                        </Link>
                        <Link href="/register" className="hover:text-slate-300 transition-colors">
                            Register
                        </Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
