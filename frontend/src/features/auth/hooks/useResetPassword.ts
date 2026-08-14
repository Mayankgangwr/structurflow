import { useState } from "react";
import { useResetPasswordMutation } from "../authApi";
import { useForm } from "react-hook-form";
import { ResetPasswordFormData } from "../types";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "../schemas/forgot-password.schema";
import { useRouter, useSearchParams } from "next/navigation";

export const useResetPassword = () => {
    const [resetPassword, { isLoading }] = useResetPasswordMutation();
    const [apiError, setApiError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const form = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            newPassword: "",
            confirmPassword: ""
        }
    });

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) {
            setApiError("Invalid or missing reset token.");
            return;
        }

        setApiError("");
        try {
            await resetPassword({ token, newPassword: data.newPassword }).unwrap();
            setIsSuccess(true);
            setTimeout(() => {
                router.push("/login");
            }, 3000);
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
