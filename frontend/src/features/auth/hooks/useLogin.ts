import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../schemas/login.schema";
import { type LoginFormData } from "../types";
import { useLoginMutation } from "../authApi";

export const useLogin = () => {
    const router = useRouter();
    const [login, { isLoading }] = useLoginMutation();
    const [apiError, setApiError] = useState("");

    const form = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: "onBlur",  // Advanced: Validate fields as soon as the user leaves them
        defaultValues: {
            email: "",
            password: "",
            rememberMe: false
        }
    });

    const { isValid, isDirty, isSubmitting } = form.formState;

    const onSubmit = async (data: LoginFormData) => {
        setApiError("");
        try {
            await login(data).unwrap();
            router.push("/dashboard");
        } catch (error) {
            if (error instanceof Error) {
                const message = error.message.toLowerCase();
                // Advanced: specific field error mapping
                if (message.includes("email") || message.includes("user")) {
                    form.setError("email", { type: "server", message: "User not found or invalid email." });
                } else if (message.includes("password") || message.includes("credential")) {
                    form.setError("password", { type: "server", message: "Invalid password." });
                } else {
                    setApiError(error.message);
                }
            } else {
                setApiError("An unknown error occurred");
            }
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