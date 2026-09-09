"use client";

import React, { useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RoleType, usePermissions } from "@/features/auth/hooks/usePermissions";
import {
    Mail,
    ShieldCheck,
    ClipboardCheck,
    Eye,
    Loader2,
    Check,
    Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (email: string, role: RoleType) => Promise<void>;
    isInviting?: boolean;
}

const roleOptions: {
    role: RoleType;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    borderActive: string;
    badgeBg: string;
}[] = [
    {
        role: "ADMIN",
        title: "Workspace Admin",
        description:
            "Can manage projects, configure extraction templates, upload files, and invite reviewers.",
        icon: ShieldCheck,
        accentColor: "text-purple-600",
        borderActive: "border-purple-500 ring-2 ring-purple-500/15 bg-purple-50/20",
        badgeBg: "bg-purple-100 text-purple-800",
    },
    {
        role: "REVIEWER",
        title: "Verification Reviewer",
        description:
            "Human-in-the-loop specialist. Can audit extraction queue, verify or reject documents, and download results.",
        icon: ClipboardCheck,
        accentColor: "text-amber-600",
        borderActive: "border-amber-500 ring-2 ring-amber-500/15 bg-amber-50/20",
        badgeBg: "bg-amber-100 text-amber-800",
    },
    {
        role: "VIEWER",
        title: "Read-Only Viewer",
        description:
            "Stakeholder auditor. Can browse projects, templates, and verified output documents in read-only mode.",
        icon: Eye,
        accentColor: "text-slate-600",
        borderActive: "border-slate-500 ring-2 ring-slate-500/15 bg-slate-50/40",
        badgeBg: "bg-slate-100 text-slate-800",
    },
];

const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
    isOpen,
    onClose,
    onInvite,
    isInviting = false,
}) => {
    const { isOwner, isAdmin, can } = usePermissions();
    const [email, setEmail] = useState("");
    const [selectedRole, setSelectedRole] = useState<RoleType>("REVIEWER");
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || (!can("manage_team") && !isOwner && !isAdmin)) return null;

    const availableRoleOptions = [
        ...(isOwner
            ? [
                  {
                      role: "OWNER" as RoleType,
                      title: "Organization Owner",
                      description:
                          "Full organization ownership, member governance, and complete workspace control.",
                      icon: Crown,
                      accentColor: "text-amber-600",
                      borderActive: "border-amber-500 ring-2 ring-amber-500/15 bg-amber-50/20",
                      badgeBg: "bg-amber-100 text-amber-800",
                  },
              ]
            : []),
        ...roleOptions,
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const cleanEmail = email.trim().toLowerCase();
        if (!cleanEmail) {
            setError("Email address is required.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
            setError("Please enter a valid email address.");
            return;
        }

        try {
            await onInvite(cleanEmail, selectedRole);
            setEmail("");
            setSelectedRole("REVIEWER");
            onClose();
        } catch (err: any) {
            setError(err?.data?.message || err?.message || "Failed to send invitation.");
        }
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            size="lg"
            title={
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-base sm:text-lg font-bold text-slate-900">Invite Team Member</span>
                </div>
            }
            description="Send an email invitation to collaborate in this workspace."
        >
            <div className="w-full">
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email Input */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="colleague@company.com"
                            className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                            autoFocus
                        />
                        {error && (
                            <p className="text-xs text-rose-600 font-medium mt-1">
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Role Selection Cards */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Select Role & Permissions <span className="text-rose-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {availableRoleOptions.map((opt) => {
                                const Icon = opt.icon;
                                const isSelected = selectedRole === opt.role;

                                return (
                                    <div
                                        key={opt.role}
                                        onClick={() => setSelectedRole(opt.role)}
                                        className={cn(
                                            "border rounded-xl p-3 flex items-start gap-3 cursor-pointer transition-all duration-150 relative",
                                            isSelected
                                                ? opt.borderActive
                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 mt-0.5",
                                                isSelected ? "bg-white" : "bg-slate-50 border-slate-100"
                                            )}
                                        >
                                            <Icon className={cn("w-4 h-4", opt.accentColor)} />
                                        </div>

                                        <div className="flex-1 min-w-0 pr-6">
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-xs font-bold text-slate-900">
                                                    {opt.title}
                                                </h4>
                                                <span
                                                    className={cn(
                                                        "text-[10px] font-semibold px-1.5 py-0.2 rounded",
                                                        opt.badgeBg
                                                    )}
                                                >
                                                    {opt.role}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                                {opt.description}
                                            </p>
                                        </div>

                                        {isSelected && (
                                            <div className="absolute right-3 top-3 w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center">
                                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isInviting}
                            className="text-xs cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isInviting || !email.trim()}
                            className="bg-primary hover:bg-primary-container text-white text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                        >
                            {isInviting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Sending Invite...</span>
                                </>
                            ) : (
                                <>
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>Send Invitation</span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </Dialog>
    );
};

export default InviteMemberModal;
