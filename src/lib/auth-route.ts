import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { member, organization } from "@/schema";

export const json = <T>(data: T, message?: string, status = 200) =>
    NextResponse.json({ success: status < 400, data, ...(message ? { message } : {}) }, { status });

export const errorJson = (message: string, status = 400, code?: string) =>
    NextResponse.json(
        { success: false, error: { code: code ?? "BAD_REQUEST", message }, message },
        { status },
    );

export const copyAuthCookies = (source: Response, target: NextResponse) => {
    const cookies = source.headers.getSetCookie?.() ?? [];
    for (const cookie of cookies) target.headers.append("set-cookie", cookie);
    return target;
};

export const toPublicUser = (user: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
}) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName ?? user.name?.split(" ")[0] ?? "",
    lastName: user.lastName ?? user.name?.split(" ").slice(1).join(" ") ?? "",
});

export async function getMemberships(userId: string) {
    return db
        .select({ organizationId: member.organizationId, role: member.role, organizationName: organization.name })
        .from(member)
        .innerJoin(organization, eq(member.organizationId, organization.id))
        .where(eq(member.userId, userId));
}

export async function getMembership(userId: string, organizationId: string) {
    const result = await db.select().from(member).where(and(
        eq(member.userId, userId),
        eq(member.organizationId, organizationId),
    )).limit(1);
    return result[0] ?? null;
}
