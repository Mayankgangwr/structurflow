"use client";

import { authClient } from "@/lib/auth-client";
import { useAppSelector } from "@/store/hooks";

export type RoleType = "OWNER" | "ADMIN" | "REVIEWER" | "VIEWER";

export type AppPermission =
    | "manage_organization"
    | "manage_team"
    | "create_project"
    | "edit_project"
    | "delete_project"
    | "manage_templates"
    | "upload_documents"
    | "delete_documents"
    | "view_analytics"
    | "manage_members"
    | "manage_settings"
    | "modify_transformed_documents"
    | "verify_documents"
    | "export_documents"
    | "view_reports";

export const ROLE_PERMISSIONS: Record<RoleType, AppPermission[]> = {
    OWNER: [
        "manage_organization",
        "manage_team",
        "create_project",
        "edit_project",
        "delete_project",
        "manage_templates",
        "upload_documents",
        "delete_documents",
        "view_analytics",
        "manage_members",
        "manage_settings",
        "modify_transformed_documents",
        "verify_documents",
        "export_documents",
        "view_reports",
    ],
    ADMIN: [
        "manage_team",
        "create_project",
        "edit_project",
        "delete_project",
        "manage_templates",
        "upload_documents",
        "delete_documents",
        "view_analytics",
        "manage_members",
        "modify_transformed_documents",
        "verify_documents",
        "export_documents",
        "view_reports",
    ],
    REVIEWER: [
        // "upload_documents",
        "modify_transformed_documents",
        "verify_documents",
        "export_documents",
        "view_reports",
    ],
    VIEWER: [
        "export_documents",
        "view_reports",
    ],
};

export function usePermissions() {
    const { data: session } = authClient.useSession();
    const { data: activeOrg } = authClient.useActiveOrganization();
    const { data: activeMember } = authClient.useActiveMember();
    const reduxAuth = useAppSelector((state) => state.auth);

    const user = (session?.user as any) || reduxAuth.user;
    const isAuthenticated = !!user;

    const activeOrganizationId =
        activeOrg?.id ||
        (session?.session as any)?.activeOrganizationId ||
        activeMember?.organizationId ||
        reduxAuth.activeOrganizationId ||
        null;

    // Resolve role from activeMember (Better-Auth returns lowercase "owner", "admin", "member")
    const rawRole = (
        activeMember?.role ||
        (reduxAuth.memberships && reduxAuth.memberships[0]?.role) ||
        "VIEWER"
    ).toUpperCase() as RoleType;

    const role: RoleType = (["OWNER", "ADMIN", "REVIEWER", "VIEWER"].includes(rawRole)
        ? rawRole
        : rawRole === "MEMBER" as any
        ? "REVIEWER"
        : "VIEWER");

    const isOwner = role === "OWNER";
    const isAdmin = role === "ADMIN";
    const isReviewer = role === "REVIEWER";
    const isViewer = role === "VIEWER";

    const can = (permission: AppPermission): boolean => {
        if (!isAuthenticated) return false;
        const allowed = ROLE_PERMISSIONS[role] || [];
        return allowed.includes(permission);
    };

    const cannot = (permission: AppPermission): boolean => !can(permission);

    /**
     * Role hierarchy check: whether current user can manage a user with targetRole
     */
    const canManageUser = (targetRole: RoleType): boolean => {
        if (isOwner) return true;
        if (isAdmin) {
            return targetRole === "REVIEWER" || targetRole === "VIEWER";
        }
        return false;
    };

    return {
        user,
        role,
        isOwner,
        isAdmin,
        isReviewer,
        isViewer,
        can,
        cannot,
        canManageUser,
        activeOrganizationId,
    };
}

export default usePermissions;
