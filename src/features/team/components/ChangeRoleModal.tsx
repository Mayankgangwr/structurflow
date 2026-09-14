"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TeamMember } from "../teamApi";
import { RoleType, usePermissions } from "@/features/auth/hooks/usePermissions";
import { UserCheck, AlertTriangle, Loader2 } from "lucide-react";

export interface ChangeRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: TeamMember | null;
    onConfirm: (userId: string, newRole: RoleType) => Promise<void>;
    isUpdating?: boolean;
}

const ChangeRoleModal: React.FC<ChangeRoleModalProps> = ({
    isOpen,
    onClose,
    member,
    onConfirm,
    isUpdating = false,
}) => {
    const { isOwner, isAdmin } = usePermissions();
    const [selectedRole, setSelectedRole] = useState<RoleType>("VIEWER");

    useEffect(() => {
        if (member) {
            setSelectedRole(member.role);
        }
    }, [member]);

    if (!isOpen || !member || (!isOwner && !isAdmin)) return null;

    const availableRoles: { role: RoleType; label: string; desc: string }[] = [
        ...(isOwner ? [{ role: "OWNER" as RoleType, label: "Owner", desc: "Full organization ownership and management" }] : []),
        { role: "ADMIN", label: "Admin", desc: "Project creation, template editing, and reviewer invitations" },
        { role: "REVIEWER", label: "Reviewer", desc: "Document verification, rejection, and data auditing" },
        { role: "VIEWER", label: "Viewer", desc: "Read-only access to projects and verified documents" },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedRole === member.role) {
            onClose();
            return;
        }
        await onConfirm(member.userId, selectedRole);
        onClose();
    };

    const isChangingToOwner = selectedRole === "OWNER" && member.role !== "OWNER";

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            size="md"
            title={
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4" />
                    </div>
                    <span className="text-base font-bold text-slate-900">Change Member Role</span>
                </div>
            }
            description={`Adjust permissions for ${member.firstName} ${member.lastName}`}
        >
            <div className="w-full">

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 text-xs">
                        <p className="text-slate-500">
                            Member: <span className="font-semibold text-slate-900">{member.email}</span>
                        </p>
                        <p className="text-slate-500 mt-1">
                            Current Role: <span className="font-semibold text-slate-900">{member.role}</span>
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Select New Role
                        </label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as RoleType)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 cursor-pointer"
                        >
                            {availableRoles.map((r) => (
                                <option key={r.role} value={r.role}>
                                    {r.label} — {r.desc}
                                </option>
                            ))}
                        </select>
                    </div>

                    {isChangingToOwner && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p>
                                <strong>Warning:</strong> You are granting Owner privileges to this user. Owners have unrestricted authority over the organization.
                            </p>
                        </div>
                    )}

                    <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isUpdating}
                            className="text-xs cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isUpdating || selectedRole === member.role}
                            className="bg-primary hover:bg-primary-container text-white text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Updating...</span>
                                </>
                            ) : (
                                <span>Save Changes</span>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </Dialog>
    );
};

export default ChangeRoleModal;
