"use client";

import React from "react";
import { TeamMember } from "../teamApi";
import { RoleType, usePermissions } from "@/features/auth/hooks/usePermissions";
import DataTable, { DataTableColumn } from "@/components/ui/data-table/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ShieldCheck,
    Crown,
    ClipboardCheck,
    Eye,
    UserX,
    Calendar,
    UserCheck,
    MoreVertical,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface MembersTableProps {
    members: TeamMember[];
    isLoading: boolean;
    currentUserId?: string;
    onChangeRole: (member: TeamMember) => void;
    onRemoveMember: (member: TeamMember) => void;
}

const roleBadgeConfig: Record<
    RoleType,
    { label: string; bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
    OWNER: {
        label: "Owner",
        bg: "bg-indigo-50 border-indigo-200/80",
        text: "text-indigo-700",
        icon: Crown,
    },
    ADMIN: {
        label: "Admin",
        bg: "bg-purple-50 border-purple-200/80",
        text: "text-purple-700",
        icon: ShieldCheck,
    },
    REVIEWER: {
        label: "Reviewer",
        bg: "bg-amber-50 border-amber-200/80",
        text: "text-amber-700",
        icon: ClipboardCheck,
    },
    VIEWER: {
        label: "Viewer",
        bg: "bg-slate-100 border-slate-200/80",
        text: "text-slate-700",
        icon: Eye,
    },
};

const MembersTable: React.FC<MembersTableProps> = ({
    members,
    isLoading,
    currentUserId,
    onChangeRole,
    onRemoveMember,
}) => {
    const { isOwner, isAdmin, canManageUser } = usePermissions();

    const getInitials = (firstName?: string, lastName?: string) => {
        const first = firstName ? firstName.charAt(0).toUpperCase() : "";
        const last = lastName ? lastName.charAt(0).toUpperCase() : "";
        return `${first}${last}` || "U";
    };

    const columns: DataTableColumn<TeamMember>[] = [
        {
            id: "user",
            header: "Team Member",
            cell: (member) => {
                const isYou = currentUserId === member.userId;
                const initials = getInitials(member.firstName, member.lastName);
                const fullName = `${member.firstName || ""} ${member.lastName || ""}`.trim() || "Team Member";

                return (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-semibold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {initials}
                        </div>
                        <div className="min-w-0 max-w-56 sm:max-w-64">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                                    {fullName}
                                </p>
                                {isYou && (
                                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-200/70 px-1.5 py-0.2 rounded-full">
                                        You
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-500 text-xs truncate mt-0.5">
                                {member.email}
                            </p>
                        </div>
                    </div>
                );
            },
        },
        {
            id: "role",
            header: "Role & Access",
            cell: (member) => {
                const config = roleBadgeConfig[member.role] || roleBadgeConfig.VIEWER;
                const Icon = config.icon;

                return (
                    <Badge
                        variant="outline"
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs ${config.bg} ${config.text}`}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{config.label}</span>
                    </Badge>
                );
            },
        },
        {
            id: "joinedAt",
            header: "Joined Organization",
            cell: (member) => (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatDate(member.joinedAt)}</span>
                </div>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            className: "w-28 text-right pr-4",
            cell: (member) => {
                const isYou = currentUserId === member.userId;
                const canManageThisUser = canManageUser(member.role);
                const isTargetOwner = member.role === "OWNER";

                // Cannot edit owner unless you are the owner
                const canChangeRole = isOwner || (isAdmin && !isTargetOwner && member.role !== "ADMIN");
                const canRemove = !isTargetOwner && (isOwner || (isAdmin && member.role !== "ADMIN")) && !isYou;

                if (!canChangeRole && !canRemove) {
                    return (
                        <span className="text-slate-300 text-xs italic pr-2">No actions</span>
                    );
                }

                return (
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Member actions"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44 p-1">
                                {canChangeRole && (
                                    <DropdownMenuItem
                                        onClick={() => onChangeRole(member)}
                                        className="text-xs text-slate-700 hover:text-slate-900 cursor-pointer flex items-center gap-2 py-1.5 px-2.5"
                                    >
                                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Change Role</span>
                                    </DropdownMenuItem>
                                )}
                                {canRemove && (
                                    <DropdownMenuItem
                                        onClick={() => onRemoveMember(member)}
                                        className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer flex items-center gap-2 py-1.5 px-2.5"
                                    >
                                        <UserX className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Remove Member</span>
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                );
            },
        },
    ];

    return (
        <DataTable
            data={members}
            columns={columns}
            isLoading={isLoading}
            emptyMessage="No team members found matching your search."
        />
    );
};

export default MembersTable;
