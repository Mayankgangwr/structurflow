import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { member } from "@/schema";
import { eq } from "drizzle-orm";

export interface AuthContext {
    user: {
        id: string;
        email: string;
        name: string;
        firstName?: string | null;
        lastName?: string | null;
    };
    session: {
        id: string;
        userId: string;
        token: string;
        activeOrganizationId?: string | null;
    };
    organizationId: string;
    membership: {
        id: string;
        role: string;
    };
}

export async function getAuthenticatedUserAndOrg(req: NextRequest): Promise<AuthContext> {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session || !session.user) {
        throw new Error("UNAUTHORIZED");
    }

    const userId = session.user.id;

    // 1. Check if X-Organization-Id header is provided
    const headerOrgId = req.headers.get("x-organization-id");

    // 2. Check session active organization
    const sessionOrgId = session.session?.activeOrganizationId;

    // Fetch user memberships to validate/find organization
    const userMemberships = await db
        .select()
        .from(member)
        .where(eq(member.userId, userId));

    let resolvedMembership: (typeof userMemberships)[number] | null = null;

    if (headerOrgId) {
        resolvedMembership = userMemberships.find((membership) => membership.organizationId === headerOrgId) ?? null;
    } else if (sessionOrgId) {
        resolvedMembership = userMemberships.find((membership) => membership.organizationId === sessionOrgId) ?? null;
    } else if (userMemberships.length > 0) {
        resolvedMembership = userMemberships[0];
    }

    if (!resolvedMembership) {
        throw new Error("ORGANIZATION_REQUIRED");
    }

    return {
        user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
        },
        session: {
            id: session.session.id,
            userId: session.session.userId,
            token: session.session.token,
            activeOrganizationId: session.session.activeOrganizationId,
        },
        organizationId: resolvedMembership.organizationId,
        membership: {
            id: resolvedMembership.id,
            role: resolvedMembership.role,
        },
    };
}
