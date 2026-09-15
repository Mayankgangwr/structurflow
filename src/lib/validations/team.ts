import { z } from "zod";

export const RoleEnum = z.enum(["OWNER", "ADMIN", "REVIEWER", "VIEWER"], {
    errorMap: () => ({ message: "Invalid role. Role must be OWNER, ADMIN, REVIEWER, or VIEWER." }),
});

export type RoleEnumType = z.infer<typeof RoleEnum>;

export const inviteMemberSchema = z.object({
    email: z.string().email("Invalid email address").transform((val) => val.trim().toLowerCase()),
    role: RoleEnum,
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const updateRoleSchema = z.object({
    role: RoleEnum,
});

export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

export class TeamValidationError extends Error {
    constructor(
        message: string,
        public details?: any,
        public statusCode: number = 400
    ) {
        super(message);
        this.name = "TeamValidationError";
    }
}

export function validateInviteMember(data: unknown): InviteMemberInput {
    // If request body is wrapped in { body: { ... } }, unwrap it
    const payload = (data && typeof data === "object" && "body" in data && typeof (data as any).body === "object")
        ? (data as any).body
        : data;

    const result = inviteMemberSchema.safeParse(payload);
    if (!result.success) {
        const firstError = result.error.errors[0]?.message || "Validation failed";
        throw new TeamValidationError(firstError, result.error.flatten());
    }
    return result.data;
}

export function validateUpdateRole(data: unknown): UpdateRoleInput {
    const payload = (data && typeof data === "object" && "body" in data && typeof (data as any).body === "object")
        ? (data as any).body
        : data;

    const result = updateRoleSchema.safeParse(payload);
    if (!result.success) {
        const firstError = result.error.errors[0]?.message || "Validation failed";
        throw new TeamValidationError(firstError, result.error.flatten());
    }
    return result.data;
}
