"use client";

import { useState } from "react";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { useGetTeamMembersQuery } from "@/features/team/teamApi";
import toast from "react-hot-toast";

export const useOrganizationSettings = () => {
    const { role, can, activeOrganizationId: activeOrgId } = usePermissions();
    const { data: teamData, isLoading: isLoadingTeam } = useGetTeamMembersQuery();

    const [copiedOrgId, setCopiedOrgId] = useState(false);

    const memberCount = teamData?.data?.length || 1;

    const handleCopyOrgId = () => {
        if (!activeOrgId) return;
        navigator.clipboard.writeText(activeOrgId);
        setCopiedOrgId(true);
        toast.success("Organization ID copied to clipboard");
        setTimeout(() => setCopiedOrgId(false), 2000);
    };

    return {
        activeOrgId,
        role,
        can,
        memberCount,
        isLoadingTeam,
        copiedOrgId,
        handleCopyOrgId,
    };
};
