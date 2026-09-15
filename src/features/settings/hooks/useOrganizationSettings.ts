"use client";

import { useState } from "react";
import { usePermissions } from "@/features/auth/hooks/usePermissions";
import { useGetOrganizationSettingsQuery } from "../settingsApi";
import { useGetTeamMembersQuery } from "@/features/team/teamApi";
import toast from "react-hot-toast";

export const useOrganizationSettings = () => {
    const { role, can, activeOrganizationId: activeOrgId } = usePermissions();
    const { data: teamData, isLoading: isLoadingTeam } = useGetTeamMembersQuery();
    const { data: orgData, isLoading: isLoadingOrg } = useGetOrganizationSettingsQuery();

    const [copiedOrgId, setCopiedOrgId] = useState(false);

    const organization = orgData?.data;
    const memberCount = organization?.memberCount || teamData?.data?.length || 1;

    const handleCopyOrgId = () => {
        const idToCopy = organization?.id || activeOrgId;
        if (!idToCopy) return;
        navigator.clipboard.writeText(idToCopy);
        setCopiedOrgId(true);
        toast.success("Organization ID copied to clipboard");
        setTimeout(() => setCopiedOrgId(false), 2000);
    };

    return {
        activeOrgId: organization?.id || activeOrgId,
        organization,
        role,
        can,
        memberCount,
        isLoadingTeam: isLoadingTeam || isLoadingOrg,
        copiedOrgId,
        handleCopyOrgId,
    };
};
