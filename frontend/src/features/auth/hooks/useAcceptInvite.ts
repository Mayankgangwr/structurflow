import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { useAcceptInviteMutation } from "../authApi";
import { useForm } from "react-hook-form";
import { AcceptInviteFormData } from "../types";
import { zodResolver } from "@hookform/resolvers/zod";
import { acceptInviteSchema } from "../schemas/accept-invite.schema";
import { setCredentials } from "../authSlice";

export const useAcceptInvite = () => {
    const router = useRouter();
    const dispatch = useDispatch();
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
            const result = await acceptInvite({ token, ...data }).unwrap();
            dispatch(setCredentials({
                user: result.data.user,
                memberships: result.data.memberships || []
            }));
            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);
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
