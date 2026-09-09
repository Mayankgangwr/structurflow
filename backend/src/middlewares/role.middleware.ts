import { Role } from "@/models/membership.model";
import { requireOrgAccess } from "./auth.middleware";

/**
 * Convenient role-based access control middleware for organization routes.
 * Usage: requireRole(Role.OWNER, Role.ADMIN)
 */
export const requireRole = (...allowedRoles: Role[]) => {
    return requireOrgAccess(allowedRoles.length > 0 ? allowedRoles : Object.values(Role));
};
