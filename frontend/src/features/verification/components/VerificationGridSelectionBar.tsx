"use client";

import React, { useRef, useEffect } from "react";
import { CheckCheck, CheckSquare, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface VerificationGridSelectionBarProps {
    totalDocuments: number;
    selectedCount: number;
    isAllSelected: boolean;
    isSomeSelected: boolean;
    onToggleSelectAll: () => void;
    onClearSelection: () => void;
    onBulkApprove: () => void;
    isBulkVerifying?: boolean;
    showWhenZero?: boolean;
}

const VerificationGridSelectionBar: React.FC<VerificationGridSelectionBarProps> = ({
    totalDocuments,
    selectedCount,
    isAllSelected,
    isSomeSelected,
    onToggleSelectAll,
    onClearSelection,
    onBulkApprove,
    isBulkVerifying = false,
    showWhenZero = true,
}) => {
    const checkboxRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (checkboxRef.current) {
            checkboxRef.current.indeterminate = isSomeSelected;
        }
    }, [isSomeSelected]);

    if (totalDocuments === 0) return null;
    if (!showWhenZero && selectedCount === 0) return null;

    return (
        <div
            className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all duration-200",
                selectedCount > 0
                    ? "bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 border-amber-300/80 shadow-2xs ring-1 ring-amber-500/10"
                    : "bg-white border-slate-200/80 shadow-2xs hover:border-slate-300"
            )}
        >
            {/* Left: Checkbox + Selection Status */}
            <div className="flex items-center gap-2.5 min-w-0">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        ref={checkboxRef}
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={onToggleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500/20 cursor-pointer transition-colors"
                        title={isAllSelected ? "Deselect all" : "Select all on this page"}
                    />
                    {selectedCount > 0 ? (
                        <span className="text-xs font-semibold text-amber-950 flex items-center gap-1.5">
                            <span className="bg-amber-100 border border-amber-200/80 text-amber-900 font-bold px-1.5 py-0.5 rounded text-[11px] shadow-2xs">
                                {selectedCount}
                            </span>
                            <span>of {totalDocuments} selected</span>
                        </span>
                    ) : (
                        <span className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                            Select all ({totalDocuments} {totalDocuments === 1 ? "document" : "documents"})
                        </span>
                    )}
                </label>
            </div>

            {/* Right: Actions when items are selected */}
            <div className="flex items-center gap-2">
                {selectedCount > 0 ? (
                    <>
                        <button
                            type="button"
                            onClick={onClearSelection}
                            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Clear all selections"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Deselect</span>
                        </button>

                        <Button
                            size="sm"
                            type="button"
                            disabled={isBulkVerifying}
                            onClick={onBulkApprove}
                            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs px-3 py-1.5 h-8 gap-1.5 shadow-xs transition-all cursor-pointer rounded-lg"
                        >
                            {isBulkVerifying ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <CheckCheck className="w-4 h-4 stroke-[2.2]" />
                            )}
                            <span>Approve Selected ({selectedCount})</span>
                        </Button>
                    </>
                ) : (
                    <span className="text-[11px] text-slate-400 hidden sm:inline-flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>Select cards to verify in batch</span>
                    </span>
                )}
            </div>
        </div>
    );
};

export default VerificationGridSelectionBar;
