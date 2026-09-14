import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, emailOTP } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import * as schema from "@/schema";
import { db } from "./db";
import { sendOtpEmail } from "./email";
import { generateWorkspaceName } from "./generate";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg",
        schema,
    }),
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        autoSignIn: false,
    },
    emailVerification: {
        autoSignInAfterVerification: true,
        async afterEmailVerification(user) {
            try {
                // Only create organization & member record if user does not already belong to one
                const existingMember = await db
                    .select()
                    .from(schema.member)
                    .where(eq(schema.member.userId, user.id));

                if (existingMember.length === 0) {
                    const userName = (user as any).firstName || user.name || "User";
                    const workspace = generateWorkspaceName(userName);
                    const orgId = "org_" + crypto.randomUUID().replace(/-/g, "");
                    const orgSlug = `${workspace.slug}-${Math.random().toString(36).slice(2, 6)}`;

                    await db.insert(schema.organization).values({
                        id: orgId,
                        name: workspace.name,
                        slug: orgSlug,
                        createdAt: new Date(),
                    });

                    await db.insert(schema.member).values({
                        id: "mem_" + crypto.randomUUID().replace(/-/g, ""),
                        organizationId: orgId,
                        userId: user.id,
                        role: "owner",
                        createdAt: new Date(),
                    });

                    // Automatically set active organization on user's active session
                    await db.update(schema.session)
                        .set({ activeOrganizationId: orgId })
                        .where(eq(schema.session.userId, user.id));

                    console.log(`[Better-Auth] Successfully created initial organization (${workspace.name}) and assigned owner member for verified user: ${user.email}`);
                }
            } catch (err) {
                console.error("[Better-Auth afterEmailVerification Error]:", err);
            }
        },
    },
    databaseHooks: {
        session: {
            create: {
                before: async (session) => {
                    // Automatically assign the user's organization as activeOrganizationId on session creation
                    if (!session.activeOrganizationId) {
                        const members = await db
                            .select()
                            .from(schema.member)
                            .where(eq(schema.member.userId, session.userId))
                            .limit(1);

                        if (members.length > 0) {
                            return {
                                data: {
                                    ...session,
                                    activeOrganizationId: members[0].organizationId,
                                },
                            };
                        }
                    }
                },
            },
        },
    },
    user: {
        additionalFields: {
            firstName: {
                type: "string",
                required: false,
            },
            lastName: {
                type: "string",
                required: false,
            },
            accountType: {
                type: "string",
                required: false,
                defaultValue: "INDIVIDUAL",
            },
        },
    },
    plugins: [
        organization({
            allowUserToCreateOrganization: true,
        }),
        emailOTP({
            sendVerificationOnSignUp: true,
            resendStrategy: "reuse",
            async sendVerificationOTP({ email, otp, type }) {
                console.log(`\n========================================`);
                console.log(`[Better-Auth OTP] Type: ${type}`);
                console.log(`[Better-Auth OTP] Recipient: ${email}`);
                console.log(`[Better-Auth OTP] Code: ${otp}`);
                console.log(`========================================\n`);

                await sendOtpEmail({
                    to: email,
                    otp,
                    type,
                });
            },
            otpLength: 6,
            expiresIn: 300, // 5 minutes
        }),
    ],
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
});
