import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organization } from "@/schema";
import { copyAuthCookies, errorJson, getMemberships, json, toPublicUser } from "@/lib/auth-route";
import { generateSlug } from "@/lib/generate";

const bodySchema = z.object({ email: z.string().email(), otp: z.string().regex(/^\d{6}$/), organizationName: z.string().trim().min(2).optional() });

export async function POST(request: NextRequest) {
    try {
        const body = bodySchema.parse(await request.json());
        const response = await auth.api.verifyEmailOTP({ headers: request.headers, body: { email: body.email.toLowerCase(), otp: body.otp }, asResponse: true }) as Response;
        if (!response.ok) return errorJson("Invalid or expired verification code", 400, "INVALID_OTP");
        const result = await response.json() as { user: Parameters<typeof toPublicUser>[0] };
        const memberships = await getMemberships(result.user.id);
        let selectedOrganization = memberships[0];

        // The auth hook creates the default workspace. Rename it atomically from this compatibility endpoint when requested.
        if (body.organizationName && selectedOrganization) {
            const baseSlug = generateSlug(body.organizationName);
            const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
            const updated = await db.update(organization).set({ name: body.organizationName, slug }).where(eq(organization.id, selectedOrganization.organizationId)).returning();
            if (updated[0]) selectedOrganization = { ...selectedOrganization, organizationName: updated[0].name };
        }

        return copyAuthCookies(response, json({
            user: toPublicUser(result.user),
            organization: selectedOrganization ? { id: selectedOrganization.organizationId, name: selectedOrganization.organizationName } : undefined,
            memberships: memberships.map(({ organizationName: _name, ...membership }) => membership),
        }, "Email verified successfully"));
    } catch (error) {
        if (error instanceof z.ZodError) return errorJson("Invalid verification data");
        console.error("[POST /api/auth/verify-otp]", error);
        return errorJson("Invalid or expired verification code", 400, "INVALID_OTP");
    }
}
