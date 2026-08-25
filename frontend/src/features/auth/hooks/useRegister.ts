import { useRouter } from "next/navigation"
import { useRegisterMutation } from "../authApi";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { RegisterFormData } from "../types";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../schemas/register.schema";
import { z } from "zod";

export const useRegister = () => {
    const router = useRouter();
    const [register, { isLoading }] = useRegisterMutation();
    const [apiError, setApiError] = useState("");

    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        mode: "onBlur",  // Advanced: Validate fields as soon as the user leaves them
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
    })

    // Advanced: Watch the password field in real-time for the strength meter
    const passwordValue = form.watch("password");

    const { isDirty, isValid, isSubmitting } = form.formState;

    const onSubmit = async (payload: z.infer<typeof registerSchema>) => {
        setApiError("");
        try {
            await register(payload).unwrap();
            router.push('/verify-email');
        } catch (err) {
            if (err instanceof Error) {
                // Advanced: specific field error mapping
                if (err.message.toLowerCase().includes("email") || err.message.toLowerCase().includes("exist")) {
                    form.setError("email", { type: "server", message: "This email is already in use." });
                } else {
                    setApiError(err.message);
                }
            } else {
                setApiError("An unknown error occurred");
            }
        }



    }

    return {
        form,
        control: form.control,
        isLoading: isSubmitting,
        isValid,
        isDirty,
        passwordValue,
        apiError,
        onSubmit: form.handleSubmit(onSubmit)
    };
}