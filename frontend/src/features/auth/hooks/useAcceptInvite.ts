import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAcceptInviteMutation } from "../authApi";
import { useForm } from "react-hook-form";
import { AcceptInviteFormData } from "../types";
import { zodResolver } from "@hookform/resolvers/zod";
import { acceptInviteSchema } from "../schemas/accept-invite.schema";

export const useAcceptInvite = () => {
    const router = useRouter();
    const [apiError, setApiError] = useState("");
    const [acceptInvite, { isLoading }] = useAcceptInviteMutation();

    const form = useForm<AcceptInviteFormData>({
        resolver: zodResolver(acceptInviteSchema),
        mode: "onBlur",
        defaultValues: {
            firstName: "",
            lastName: "",
            password: "",
            confirmPassword: "",
        }
    });

    const passwordValue = form.watch("password");

    const { isValid, isDirty, isSubmitting } = form.formState;

    const handleAcceptInvite = async (token: string, data: AcceptInviteFormData) => {
        try {
            await acceptInvite({
                token,
                password: data.password,
            }).unwrap();
            router.push("/dashboard");
        } catch (error) {
            if (error instanceof Error) {
                setApiError(error.message);
            } else {
                setApiError("An unknown error occurred");
            }
        }
    }

    return {
        form,
        control: form.control,
        isLoading: isLoading || isSubmitting,
        isValid,
        isDirty,
        passwordValue,
        apiError,
        handleAcceptInvite
    };


}
