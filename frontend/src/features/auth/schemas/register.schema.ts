import { z } from "zod";

export const registerSchema = z.object({
    firstName: z.string().min(2, "First name must be at least 2 characters."),
    lastName: z.string().min(2, "Last name must be at least 2 characters."),
    email: z.string().email("Please enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string(),
    agreeTerms: z.boolean().refine(val => val === true, {
        message: "You must agree to the terms and privacy policy."
    }),
    accountType: z.enum(["INDIVIDUAL", "ORGANIZATION"]),
    organizationName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
}).refine((data) => {
    if (data.accountType === "ORGANIZATION") {
        return !!data.organizationName && data.organizationName.length >= 3;
    }
    return true;
}, {
    message: "Organization name is required (min 3 characters).",
    path: ["organizationName"],
});

