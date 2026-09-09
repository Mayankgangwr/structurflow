"use client";

import React from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TeamMember } from "../teamApi";
import { UserX, AlertTriangle, Loader2 } from "lucide-react";
import { usePermissions } from "@/features/auth/hooks/usePermissions";

export interface RemoveMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: TeamMember | null;
    onConfirm: (userId: string) => Promise<void>;
    isRemoving?: boolean;
}

const RemoveMemberModal: React.FC<RemoveMemberModalProps> = ({
    isOpen,
    onClose,
    member,
    onConfirm,
    isRemoving = false,
}) => {
    const { isOwner, isAdmin } = usePermissions();
    if (!isOpen || !member || (!isOwner && !isAdmin)) return null;

    const handleConfirm = async () => {
        await onConfirm(member.userId);
        onClose();
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            size="md"
            title={
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <UserX className="w-4 h-4" />
                    </div>
                    <span className="text-base font-bold text-slate-900">Remove Team Member</span>
                </div>
            }
            description="Revoke workspace access for this collaborator."
        >
            <div className="w-full">

                <div className="space-y-3 mb-5">
                    <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-xs">
                        <p className="text-slate-500">
                            Name:{" "}
                            <span className="font-semibold text-slate-900">
                                {member.firstName} {member.lastName}
                            </span>
                        </p>
                        <p className="text-slate-500 mt-1">
                            Email: <span className="font-semibold text-slate-900">{member.email}</span>
                        </p>
                        <p className="text-slate-500 mt-1">
                            Role: <span className="font-semibold text-slate-900">{member.role}</span>
                        </p>
                    </div>

                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <p>
                            Are you sure you want to remove this member? They will immediately lose access to all projects, extraction templates, and documents in this workspace.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isRemoving}
                        className="text-xs cursor-pointer"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isRemoving}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                    >
                        {isRemoving ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Removing...</span>
                            </>
                        ) : (
                            <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>Remove Member</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
};

export default RemoveMemberModal;
