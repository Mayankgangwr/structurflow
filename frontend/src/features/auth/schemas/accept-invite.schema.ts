import z from "zod";

export const acceptInviteSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(1, "Last name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string()
}).refine(data => {
    if (data.password && data.confirmPassword) {
        return data.password === data.confirmPassword;
    }
    return true;
}, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});