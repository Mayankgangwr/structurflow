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

    let resolvedOrgId: string | null = null;

    if (headerOrgId && userMemberships.some((m) => m.organizationId === headerOrgId)) {
        resolvedOrgId = headerOrgId;
    } else if (sessionOrgId && userMemberships.some((m) => m.organizationId === sessionOrgId)) {
        resolvedOrgId = sessionOrgId;
    } else if (userMemberships.length > 0) {
        resolvedOrgId = userMemberships[0].organizationId;
    }

    if (!resolvedOrgId) {
        throw new Error("ORGANIZATION_REQUIRED");
    }

    return {
        user: session.user as any,
        session: session.session as any,
        organizationId: resolvedOrgId,
    };
}
