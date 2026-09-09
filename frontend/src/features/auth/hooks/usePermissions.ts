"use client";

import { useAppSelector } from "@/store/hooks";

export type AppPermission =
    | "manage_organization"
    | "manage_team"
    | "create_project"
    | "edit_project"
    | "delete_project"
    | "manage_templates"
    | "upload_documents"
    | "delete_documents"
    | "verify_documents"
    | "export_documents"
    | "view_reports";

export type RoleType = "OWNER" | "ADMIN" | "REVIEWER" | "VIEWER";

const ROLE_PERMISSIONS: Record<RoleType, AppPermission[]> = {
    OWNER: [
        "manage_organization",
        "manage_team",
        "create_project",
        "edit_project",
        "delete_project",
        "manage_templates",
        "upload_documents",
        "delete_documents",
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
        "verify_documents",
        "export_documents",
        "view_reports",
    ],
    REVIEWER: [
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
    const { user, memberships, activeOrganizationId, isAuthenticated } = useAppSelector(
        (state) => state.auth
    );

    // Find active membership matching current organization
    const activeMembership = (memberships || []).find(
        (m: any) =>
            m.organizationId === activeOrganizationId ||
            m.organizationId?._id === activeOrganizationId ||
            (typeof m.organizationId === "object" && m.organizationId?.id === activeOrganizationId)
    );

    // Fallback: If user is authenticated and is the sole org creator or no role found, default to OWNER if matching
    const rawRole = (activeMembership?.role || (memberships && memberships[0]?.role) || "VIEWER") as RoleType;
    const role: RoleType = (["OWNER", "ADMIN", "REVIEWER", "VIEWER"].includes(rawRole) ? rawRole : "VIEWER");

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
