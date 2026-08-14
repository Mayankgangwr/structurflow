import { z } from "zod";
import { Role } from "@/models/membership.model";

export const inviteMemberSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address'),
        role: z.nativeEnum(Role, {
            error: () => ({ message: 'Invalid role' })
        }),
    }),
});

export const acceptInviteSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Token is required'),
        // If they are a new user, they need a password. If they are existing, they might just need the token.
        // We'll require a password to create their account if they don't exist.
        firstName: z.string().min(1, 'First name is required').optional(),
        lastName: z.string().min(1, 'Last name is required').optional(),
        password: z.string().min(8, 'Password must be at least 8 characters').optional(),
    }),
})