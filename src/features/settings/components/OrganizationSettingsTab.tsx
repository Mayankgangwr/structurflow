"use client";

import React from "react";
import { Building, Shield, Copy, Check, ExternalLink, Users, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useOrganizationSettings } from "../hooks/useOrganizationSettings";
import { cn } from "@/lib/utils";

export const OrganizationSettingsTab: React.FC = () => {
    const {
        activeOrgId,
        role,
        memberCount,
        isLoadingTeam,
        copiedOrgId,
        handleCopyOrgId,
    } = useOrganizationSettings();

    const rolePrivileges = {
        OWNER: "Full administrative control, billing ownership, role delegation, document operations, and workspace deletion.",
        ADMIN: "Project & template creation, member invitations, document operations, and verification authority.",
        REVIEWER: "Document auditing, inline field corrections, verification sign-offs, and data rejection.",
        VIEWER: "Read-only inspection of projects, audit trails, and document export.",
    };

    return (
        <div className="space-y-6">
            {/* Organization Overview */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                            <Building className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Organization Identity</h2>
                            <p className="text-xs text-slate-500">Multi-tenant workspace identifiers and membership summary</p>
                        </div>
                    </div>

                    <Link href="/team">
                        <Button
                            variant="outline"
                            className="text-xs sm:text-sm font-semibold gap-1.5 py-1.5 px-3 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                            <Users className="w-4 h-4 text-slate-500" />
                            <span>Manage Team ({memberCount})</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                    </Link>
                </div>

                <div className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Organization ID</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                readOnly
                                value={activeOrgId || "No active organization selected"}
                                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-600 select-all"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCopyOrgId}
                                className="shrink-0 text-xs font-medium gap-1.5 py-2 px-3 border-slate-200 hover:bg-slate-50 cursor-pointer"
                                title="Copy ID"
                            >
                                {copiedOrgId ? (
                                    <>
                                        <Check className="w-4 h-4 text-emerald-600" />
                                        <span className="text-emerald-600">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-4 h-4 text-slate-600" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="text-[11px] text-slate-400">
                            Use this unique identifier when making requests via the StructurFlow REST API or configuring webhooks.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                            <span className="text-xs font-medium text-slate-500 block mb-1">Your Active Role</span>
                            <div className="flex items-center gap-2">
                                <span
                                    className={cn(
                                        "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border",
                                        role === "OWNER" && "bg-amber-50 text-amber-700 border-amber-200",
                                        role === "ADMIN" && "bg-blue-50 text-blue-700 border-blue-200",
                                        role === "REVIEWER" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                                        role === "VIEWER" && "bg-slate-100 text-slate-700 border-slate-300"
                                    )}
                                >
                                    {role || "MEMBER"}
                                </span>
                                <Shield className="w-4 h-4 text-slate-400" />
                            </div>
                            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                                {role ? rolePrivileges[role as keyof typeof rolePrivileges] : "Standard team privileges."}
                            </p>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/70">
                            <span className="text-xs font-medium text-slate-500 block mb-1">Total Workspace Members</span>
                            <div className="text-2xl font-bold text-slate-900 tracking-tight">
                                {isLoadingTeam ? "..." : memberCount}
                            </div>
                            <p className="text-xs text-slate-600 mt-2">
                                Active collaborators in this organization with assigned security permissions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizationSettingsTab;
