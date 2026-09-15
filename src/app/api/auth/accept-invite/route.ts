import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { invitation, member, organization, session, user } from "@/schema";
import { and, eq } from "drizzle-orm";
import { copyAuthCookies, errorJson, getMemberships, json, toPublicUser } from "@/lib/auth-route";

const bodySchema = z.object({
    token: z.string().min(1),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    password: z.string().min(6),
});

export async function POST(req: NextRequest) {
    try {
        const body = bodySchema.parse(await req.json());
        const { token, firstName, lastName, password } = body;

        // 1. Fetch invitation record
        const [invite] = await db
            .select({
                id: invitation.id,
                email: invitation.email,
                role: invitation.role,
                status: invitation.status,
                expiresAt: invitation.expiresAt,
                organizationId: invitation.organizationId,
                organizationName: organization.name,
            })
            .from(invitation)
            .leftJoin(organization, eq(invitation.organizationId, organization.id))
            .where(eq(invitation.id, token))
            .limit(1);

        if (!invite) {
            return errorJson("Invalid or expired invitation link", 404, "INVITE_NOT_FOUND");
        }

        if (invite.status !== "pending" && invite.status !== "PENDING") {
            return errorJson("This invitation has already been accepted or revoked", 400, "INVITE_INACTIVE");
        }

        if (new Date(invite.expiresAt) < new Date()) {
            return errorJson("This invitation has expired", 400, "INVITE_EXPIRED");
        }

        const normalizedEmail = invite.email.trim().toLowerCase();

        // 2. Check if user already exists
        const [existingUser] = await db
            .select()
            .from(user)
            .where(eq(user.email, normalizedEmail))
            .limit(1);

        let activeUser = existingUser;
        let authResponse: Response | null = null;

        if (!existingUser) {
            // New user registration
            const fullName = `${firstName || ""} ${lastName || ""}`.trim() || normalizedEmail.split("@")[0];

            authResponse = await auth.api.signUpEmail({
                body: {
                    email: normalizedEmail,
                    password,
                    name: fullName,
                    firstName: firstName || "",
                    lastName: lastName || "",
                },
                headers: req.headers,
                asResponse: true,
            }) as Response;

            if (!authResponse?.ok) {
                const errorData = await authResponse.json().catch(() => ({}));
                return errorJson(errorData?.message || "Failed to create user account", 400);
            }

            // Immediately mark email as verified since they accepted via verified email invite link
            const [createdUser] = await db
                .update(user)
                .set({ emailVerified: true })
                .where(eq(user.email, normalizedEmail))
                .returning();

            activeUser = createdUser;
        } else {
            // Existing user: sign in with password to confirm identity
            authResponse = await auth.api.signInEmail({
                body: {
                    email: normalizedEmail,
                    password,
                },
                headers: req.headers,
                asResponse: true,
            }) as Response;

            if (!authResponse?.ok) {
                return errorJson("Invalid password. Please enter your existing account password to accept this invite.", 401, "INVALID_CREDENTIALS");
            }
        }

        if (!activeUser?.id) {
            return errorJson("Failed to authenticate user", 500);
        }

        // 3. Ensure membership in the invited organization
        const [existingMember] = await db
            .select()
            .from(member)
            .where(
                and(
                    eq(member.userId, activeUser.id),
                    eq(member.organizationId, invite.organizationId)
                )
            )
            .limit(1);

        const assignedRole = (invite.role || "member").toLowerCase();

        if (!existingMember) {
            await db.insert(member).values({
                id: "mem_" + crypto.randomUUID().replace(/-/g, ""),
                organizationId: invite.organizationId,
                userId: activeUser.id,
                role: assignedRole,
                createdAt: new Date(),
            });
        } else if (existingMember.role !== assignedRole) {
            await db
                .update(member)
                .set({ role: assignedRole })
                .where(eq(member.id, existingMember.id));
        }

        // 4. Mark invitation as accepted
        await db
            .update(invitation)
            .set({ status: "accepted" })
            .where(eq(invitation.id, token));

        // 5. Update user's active session with this organization
        await db
            .update(session)
            .set({ activeOrganizationId: invite.organizationId })
            .where(eq(session.userId, activeUser.id));

        // 6. Fetch updated memberships
        const memberships = await getMemberships(activeUser.id);

        const response = json({
            user: toPublicUser(activeUser),
            memberships: memberships.map(({ organizationName: _name, ...m }) => m),
            organization: {
                id: invite.organizationId,
                name: invite.organizationName || "Organization",
            },
        }, "Invite accepted successfully");

        // Copy auth session cookies to response
        if (authResponse) {
            copyAuthCookies(authResponse, response);
        }

        return response;
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return errorJson("Invalid request data", 400);
        }
        console.error("[POST /api/auth/accept-invite error]:", error);
        return errorJson(error?.message || "Failed to accept invitation", 500);
    }
}
