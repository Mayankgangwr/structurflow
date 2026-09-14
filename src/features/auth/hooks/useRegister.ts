import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../schemas/register.schema";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { generateSlug, generateWorkspaceName } from "@/lib/generate";

export const useRegister = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState("");

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        mode: "onBlur",
        defaultValues: {
            firstName: "",
            lastName: "",
            email: "",
            password: "",
            confirmPassword: "",
            accountType: "INDIVIDUAL",
            organizationName: "",
            agreeTerms: false,
        }
    });

    const passwordValue = form.watch("password");
    const { isDirty, isValid, isSubmitting } = form.formState;

    const onSubmit = async (payload: z.infer<typeof registerSchema>) => {
        setApiError("");
        setIsLoading(true);
        try {
            const result = await authClient.signUp.email({
                email: payload.email,
                password: payload.password,
                name: `${payload.firstName} ${payload.lastName}`.trim(),
                firstName: payload.firstName,
                lastName: payload.lastName,
                accountType: payload.accountType,
            } as any);

            if (result.error) {
                const message = result.error.message?.toLowerCase() || "";
                if (message.includes("email") || message.includes("exist")) {
                    form.setError("email", { type: "server", message: "This email is already in use." });
                } else {
                    setApiError(result.error.message || "Registration failed");
                }
            } else {
                if (typeof window !== "undefined") {
                    localStorage.setItem("pending_verification_email", payload.email);
                    if (payload.organizationName) {
                        localStorage.setItem("pending_org_name", payload.organizationName);
                    }
                    if (payload.firstName) {
                        localStorage.setItem("pending_first_name", payload.firstName);
                    }
                }

                router.push(`/verify-email?email=${encodeURIComponent(payload.email)}`);
            }
        } catch (err) {
            if (err instanceof Error) {
                setApiError(err.message);
            } else {
                setApiError("An unknown error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    }

    return {
        form,
        control: form.control,
        isLoading: isSubmitting || isLoading,
        isValid,
        isDirty,
        passwordValue,
        apiError,
        onSubmit: form.handleSubmit(onSubmit)
    };
}
