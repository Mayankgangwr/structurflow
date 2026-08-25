import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { otpSchema } from "../schemas/login.schema";
import { type OtpFormData } from "../types";
import { useVerifyOTPMutation } from "../authApi";

export const useVerifyOTP = (defaultOtp: string = "") => {
    const router = useRouter();
    const [verifyOTP, { isLoading }] = useVerifyOTPMutation();
    const [apiError, setApiError] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);

    const form = useForm<OtpFormData>({
        resolver: zodResolver(otpSchema),
        mode: "onBlur",
        defaultValues: {
            otp: defaultOtp,
        }
    });

    const { isValid, isDirty, isSubmitting } = form.formState;

    const handleVerify = async (data: OtpFormData, token: string) => {
        setApiError("");
        try {
            await verifyOTP({ ...data, token }).unwrap();
            
            setIsSuccess(true);
            
            // Delay redirect to allow the success UI to show
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
    };

    return {
        form,
        control: form.control,
        isLoading: isSubmitting || isLoading,
        isValid,
        isDirty,
        apiError,
        isSuccess,
        handleVerify
    };
};