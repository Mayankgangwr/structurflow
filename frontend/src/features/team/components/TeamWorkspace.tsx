"use client";

import React, { useState, useMemo } from "react";
import {
    useGetTeamMembersQuery,
    useGetPendingInvitesQuery,
    useInviteMemberMutation,
    useUpdateMemberRoleMutation,
    useRemoveMemberMutation,
    useRevokeInviteMutation,
    useResendInviteMutation,
    TeamMember,
} from "../teamApi";
import { usePermissions, RoleType } from "@/features/auth/hooks/usePermissions";
import TeamKPIHeader from "./TeamKPIHeader";
import MembersTable from "./MembersTable";
import PendingInvitesTable from "./PendingInvitesTable";
import InviteMemberModal from "./InviteMemberModal";
import ChangeRoleModal from "./ChangeRoleModal";
import RemoveMemberModal from "./RemoveMemberModal";
import { Button } from "@/components/ui/button";
import {
    Users,
    Mail,
    UserPlus,
    Search,
    Shield,
    RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const TeamWorkspace: React.FC = () => {
    const { user, role, isOwner, isAdmin, can } = usePermissions();

    // Queries
    const {
        data: membersRes,
        isLoading: isMembersLoading,
        isFetching: isMembersFetching,
        refetch: refetchMembers,
    } = useGetTeamMembersQuery();

    const {
        data: invitesRes,
        isLoading: isInvitesLoading,
        isFetching: isInvitesFetching,
        refetch: refetchInvites,
    } = useGetPendingInvitesQuery(undefined, {
        skip: !isOwner && !isAdmin, // Only Admins and Owners can fetch invites
    });

    // Mutations
    const [inviteMemberMutation, { isLoading: isInviting }] = useInviteMemberMutation();
    const [updateRoleMutation, { isLoading: isUpdatingRole }] = useUpdateMemberRoleMutation();
    const [removeMemberMutation, { isLoading: isRemovingMember }] = useRemoveMemberMutation();
    const [revokeInviteMutation] = useRevokeInviteMutation();
    const [resendInviteMutation] = useResendInviteMutation();

    // Local State
    const [activeTab, setActiveTab] = useState<"members" | "invites">("members");
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [processingInviteId, setProcessingInviteId] = useState<string | null>(null);

    // Modal state
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [roleChangeMember, setRoleChangeMember] = useState<TeamMember | null>(null);
    const [removeMember, setRemoveMember] = useState<TeamMember | null>(null);

    const members = membersRes?.data || [];
    const invites = invitesRes?.data || [];

    // Filter members based on search and role
    const filteredMembers = useMemo(() => {
        return members.filter((m) => {
            const matchesSearch =
                !searchQuery.trim() ||
                `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                m.email.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesRole = roleFilter === "ALL" || m.role === roleFilter;

            return matchesSearch && matchesRole;
        });
    }, [members, searchQuery, roleFilter]);

    // KPI Counts
    const adminCount = members.filter((m) => m.role === "ADMIN" || m.role === "OWNER").length;
    const reviewerCount = members.filter((m) => m.role === "REVIEWER").length;

    // Handlers
    const handleInvite = async (email: string, targetRole: RoleType) => {
        try {
            await inviteMemberMutation({ email, role: targetRole }).unwrap();
            toast.success(`Invitation sent to ${email}`);
            setIsInviteModalOpen(false);
            refetchInvites();
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to send invitation");
            throw err;
        }
    };

    const handleConfirmRoleChange = async (userId: string, newRole: RoleType) => {
        try {
            await updateRoleMutation({ userId, role: newRole }).unwrap();
            toast.success("Role updated successfully");
            setRoleChangeMember(null);
            refetchMembers();
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to update role");
        }
    };

    const handleConfirmRemove = async (userId: string) => {
        try {
            await removeMemberMutation({ userId }).unwrap();
            toast.success("Member removed from organization");
            setRemoveMember(null);
            refetchMembers();
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to remove member");
        }
    };

    const handleRevokeInvite = async (inviteId: string) => {
        setProcessingInviteId(inviteId);
        try {
            await revokeInviteMutation({ inviteId }).unwrap();
            toast.success("Invitation revoked");
            refetchInvites();
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to revoke invitation");
        } finally {
            setProcessingInviteId(null);
        }
    };

    const handleResendInvite = async (inviteId: string) => {
        setProcessingInviteId(inviteId);
        try {
            await resendInviteMutation({ inviteId }).unwrap();
            toast.success("Invitation email resent");
            refetchInvites();
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to resend invitation");
        } finally {
            setProcessingInviteId(null);
        }
    };

    const canInvite = can("manage_team") || isOwner || isAdmin;

    return (
        <div className="p-2 xs:px-4 xs:py-4 flex-1 flex flex-col gap-2 sm:gap-3 max-w-360 mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="font-headline-md text-2xl font-bold text-slate-900 tracking-tight">
                            Team & Access Management
                        </h1>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                            <Shield className="w-3.5 h-3.5" />
                            {role || "VIEWER"}
                        </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Manage collaborators, assign role-based permissions, and track active invitations.
                    </p>
                </div>

                {canInvite && (
                    <Button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="bg-primary hover:bg-primary-container text-white text-xs sm:text-sm font-semibold gap-1.5 shadow-sm py-2 px-4 cursor-pointer self-start sm:self-auto"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Invite Member</span>
                    </Button>
                )}
            </div>

            {/* KPI Cards */}
            <TeamKPIHeader
                totalMembers={members.length}
                adminCount={adminCount}
                reviewerCount={reviewerCount}
                pendingInvitesCount={invites.length}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                roleFilter={roleFilter}
                onRoleFilterChange={setRoleFilter}
            />

            {/* Toolbar: Search, Role Filter & Tab Switcher */}
            <div className="bg-surface p-2.5 sm:p-3 rounded-xl border border-border-subtle shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Left: Tab Switcher */}
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg shrink-0">
                    <button
                        onClick={() => setActiveTab("members")}
                        className={cn(
                            "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                            activeTab === "members"
                                ? "bg-white text-slate-900 shadow-xs"
                                : "text-slate-600 hover:text-slate-900"
                        )}
                    >
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Members ({members.length})</span>
                    </button>

                    {(isOwner || isAdmin) && (
                        <button
                            onClick={() => setActiveTab("invites")}
                            className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                                activeTab === "invites"
                                    ? "bg-white text-slate-900 shadow-xs"
                                    : "text-slate-600 hover:text-slate-900"
                            )}
                        >
                            <Mail className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Pending Invites ({invites.length})</span>
                        </button>
                    )}
                </div>

                {/* Right: Search & Role Filter (when on members tab) */}
                {activeTab === "members" && (
                    <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or email..."
                                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                        >
                            <option value="ALL">All Roles</option>
                            <option value="OWNER">Owners</option>
                            <option value="ADMIN">Admins</option>
                            <option value="REVIEWER">Reviewers</option>
                            <option value="VIEWER">Viewers</option>
                        </select>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="mb-2">
                {activeTab === "members" ? (
                    <MembersTable
                        members={filteredMembers}
                        isLoading={isMembersLoading || isMembersFetching}
                        currentUserId={user?.id}
                        onChangeRole={(m) => setRoleChangeMember(m)}
                        onRemoveMember={(m) => setRemoveMember(m)}
                    />
                ) : (
                    <PendingInvitesTable
                        invites={invites}
                        isLoading={isInvitesLoading || isInvitesFetching}
                        onResendInvite={handleResendInvite}
                        onRevokeInvite={handleRevokeInvite}
                        processingInviteId={processingInviteId}
                    />
                )}
            </div>

            {/* Modals */}
            <InviteMemberModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
                onInvite={handleInvite}
                isInviting={isInviting}
            />

            <ChangeRoleModal
                isOpen={!!roleChangeMember}
                onClose={() => setRoleChangeMember(null)}
                member={roleChangeMember}
                onConfirm={handleConfirmRoleChange}
                isUpdating={isUpdatingRole}
            />

            <RemoveMemberModal
                isOpen={!!removeMember}
                onClose={() => setRemoveMember(null)}
                member={removeMember}
                onConfirm={handleConfirmRemove}
                isRemoving={isRemovingMember}
            />
        </div>
    );
};

export default TeamWorkspace;
