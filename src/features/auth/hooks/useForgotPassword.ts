import { useState } from "react";
import { useForgotPasswordMutation } from "../authApi"
import { useForm } from "react-hook-form";
import { ForgotPasswordFormData } from "../types";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "../schemas/forgot-password.schema";

export const useForgotPassword = () => {
    const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
    const [apiError, setApiError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: ""
        }
    });

    const onSubmit = async (data: { email: string }) => {
        setApiError("");
        try {
            await forgotPassword(data).unwrap();
            setIsSuccess(true);
        } catch (error: any) {
            setApiError(error.message || "An unknown error occurred");
        }
    };

    return {
        form,
        isLoading,
        apiError,
        isSuccess,
        onSubmit: form.handleSubmit(onSubmit)
    };
}