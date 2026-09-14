"use client";

import React from "react";
import Link from "next/link";
import { Shield, Sparkles, ArrowRight, Zap, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const SandboxHeader: React.FC = () => {
    return (
        <header className="w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                {/* Brand & Sandbox Badge */}
                <div className="flex items-center gap-3">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary via-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-slate-900 text-lg tracking-tight">
                            Structur<span className="text-primary">Flow</span>
                        </span>
                    </Link>

                    <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Guest Sandbox
                        </span>
                        <span className="hidden md:inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
                            <Shield className="w-3.5 h-3.5 text-slate-400" />
                            Zero-Retention Mode (No DB Save)
                        </span>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2.5">
                    <Link href="/login">
                        <Button variant="ghost" size="sm" className="text-xs text-slate-600 hover:text-slate-900">
                            Sign In
                        </Button>
                    </Link>
                    <Link href="/register">
                        <Button size="sm" className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold gap-1.5 shadow-xs">
                            <span>Create Free Workspace</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                    </Link>
                </div>
            </div>
        </header>
    );
};
