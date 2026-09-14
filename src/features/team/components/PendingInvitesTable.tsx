"use client";

import React from "react";
import { PendingInvite } from "../teamApi";
import DataTable, { DataTableColumn } from "@/components/ui/data-table/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Clock, RefreshCw, X, Loader2, User } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { usePermissions } from "@/features/auth/hooks/usePermissions";

export interface PendingInvitesTableProps {
    invites: PendingInvite[];
    isLoading: boolean;
    onResendInvite: (inviteId: string) => void;
    onRevokeInvite: (inviteId: string) => void;
    processingInviteId?: string | null;
}

const PendingInvitesTable: React.FC<PendingInvitesTableProps> = ({
    invites,
    isLoading,
    onResendInvite,
    onRevokeInvite,
    processingInviteId,
}) => {
    const { isOwner } = usePermissions();
    const columns: DataTableColumn<PendingInvite>[] = [
        {
            id: "email",
            header: "Invited Email",
            cell: (invite) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 max-w-64">
                        <p className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                            {invite.email}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            Invitation sent {formatDate(invite.createdAt)}
                        </p>
                    </div>
                </div>
            ),
        },
        {
            id: "role",
            header: "Target Role",
            cell: (invite) => (
                <Badge
                    variant="outline"
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs bg-slate-100 text-slate-700"
                >
                    {invite.role}
                </Badge>
            ),
        },
        {
            id: "inviter",
            header: "Invited By",
            cell: (invite) => (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 truncate max-w-44">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{invite.inviter?.name || invite.inviter?.email || "Workspace Admin"}</span>
                </div>
            ),
        },
        {
            id: "expires",
            header: "Expiration",
            cell: (invite) => (
                <div className="flex items-center gap-1.5 text-xs text-amber-700 font-medium">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>Expires {formatDate(invite.expiresAt)}</span>
                </div>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            className: "w-44 text-right pr-4",
            cell: (invite) => {
                const isBusy = processingInviteId === invite.id;
                const canManageInvite = isOwner || invite.role !== "OWNER";

                if (!canManageInvite) {
                    return (
                        <span className="text-slate-300 text-xs italic pr-2">No actions</span>
                    );
                }

                return (
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => onResendInvite(invite.id)}
                            className="h-7.5 px-2.5 text-xs text-slate-600 hover:text-slate-900 border-slate-200 cursor-pointer gap-1"
                            title="Resend invitation email and extend expiration"
                        >
                            {isBusy ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <RefreshCw className="w-3 h-3" />
                            )}
                            <span>Resend</span>
                        </Button>

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isBusy}
                            onClick={() => onRevokeInvite(invite.id)}
                            className="h-7.5 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 cursor-pointer gap-1"
                            title="Revoke invitation"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Revoke</span>
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <DataTable
            data={invites}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No pending invitations. All invited members have joined!"
        />
    );
};

export default PendingInvitesTable;
