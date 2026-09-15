import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/schema";
import { eq } from "drizzle-orm";
import { errorJson, getMemberships, json, toPublicUser } from "@/lib/auth-route";

export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: req.headers,
        });

        if (!session?.user) {
            return errorJson("Unauthorized", 401, "UNAUTHORIZED");
        }

        const [userRecord] = await db
            .select()
            .from(user)
            .where(eq(user.id, session.user.id))
            .limit(1);

        if (!userRecord) {
            return errorJson("User not found", 404, "USER_NOT_FOUND");
        }

        const memberships = await getMemberships(userRecord.id);

        const activeOrgId = session.session?.activeOrganizationId || req.headers.get("x-organization-id");
        const activeMembership = memberships.find((m) => m.organizationId === activeOrgId) || memberships[0];

        return json({
            user: toPublicUser(userRecord),
            memberships: memberships.map(({ organizationName: _name, ...m }) => m),
            organization: activeMembership
                ? { id: activeMembership.organizationId, name: activeMembership.organizationName }
                : undefined,
        }, "User fetched successfully");
    } catch (error: any) {
        console.error("[GET /api/auth/me error]:", error);
        return errorJson(error?.message || "Failed to fetch user session", 500);
    }
}
