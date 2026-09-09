"use client";

import React from "react";
import { usePermissions, AppPermission, RoleType } from "@/features/auth/hooks/usePermissions";

export interface PermissionGateProps {
    permission?: AppPermission;
    allowedRoles?: RoleType | RoleType[];
    fallback?: React.ReactNode;
    children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
    permission,
    allowedRoles,
    fallback = null,
    children,
}) => {
    const { can, role } = usePermissions();

    if (permission && !can(permission)) {
        return <>{fallback}</>;
    }

    if (allowedRoles) {
        const rolesList = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        if (!rolesList.includes(role)) {
            return <>{fallback}</>;
        }
    }

    return <>{children}</>;
};

export default PermissionGate;
