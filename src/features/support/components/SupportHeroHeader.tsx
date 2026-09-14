"use client";

import React from "react";
import { LifeBuoy } from "lucide-react";

export const SupportHeroHeader: React.FC = () => {
    return (
        <div>
            <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                    <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Help & Support Center</h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Knowledge base, pipeline documentation, and dedicated engineering support for StructurFlow.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SupportHeroHeader;
