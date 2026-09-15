import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../schemas/login.schema";
import { type LoginFormData } from "../types";
import { authClient } from "@/lib/auth-client";

export const useLogin = () => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState("");

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: "onBlur",
        defaultValues: {
            email: "",
            password: "",
            rememberMe: false
        }
    });

    const { isValid, isDirty, isSubmitting } = form.formState;

    const onSubmit = async (data: LoginFormData) => {
        setApiError("");
        setIsLoading(true);
        try {
            const result = await authClient.signIn.email({
                email: data.email,
                password: data.password,
            });

            if (result.error) {
                const message = result.error.message?.toLowerCase() || "";
                if (message.includes("verif")) {
                    setApiError("Email not verified yet. Sending a new code and redirecting to verification...");
                    if (typeof window !== "undefined") {
                        localStorage.setItem("pending_verification_email", data.email);
                    }
                    await authClient.emailOtp.sendVerificationOtp({
                        email: data.email,
                        type: "email-verification",
                    }).catch((err) => {
                        console.log("Send verification OTP notice:", err);
                    });
                    setTimeout(() => {
                        router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
                    }, 1500);
                } else if (message.includes("email") || message.includes("user")) {
                    form.setError("email", { type: "server", message: "User not found or invalid email." });
                } else if (message.includes("password") || message.includes("credential")) {
                    form.setError("password", { type: "server", message: "Invalid password." });
                } else {
                    setApiError(result.error.message || "Login failed");
                }
            } else {
                router.push("/dashboard");
            }
        } catch (error) {
            if (error instanceof Error) {
                setApiError(error.message);
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
        apiError,
        onSubmit: form.handleSubmit(onSubmit)
    }
}
