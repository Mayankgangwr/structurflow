import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { otpSchema } from "../schemas/login.schema";
import { type OtpFormData } from "../types";
import { authClient } from "@/lib/auth-client";
import { generateSlug } from "@/lib/generate";

export const useVerifyOTP = (defaultOtp: string = "") => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
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

    const handleVerify = async (data: OtpFormData, emailOrToken?: string) => {
        setApiError("");
        setIsLoading(true);
        try {
            const email = (emailOrToken && emailOrToken.includes("@"))
                ? emailOrToken
                : searchParams?.get("email")
                || (typeof window !== "undefined" ? localStorage.getItem("pending_verification_email") : null)
                || "";

            if (!email) {
                setApiError("Email address is required to verify OTP.");
                setIsLoading(false);
                return;
            }

            const res = await authClient.emailOtp.verifyEmail({
                email: email.trim().toLowerCase(),
                otp: data.otp.trim(),
            });

            if (res.error) {
                setApiError(res.error.message || "Failed to verify OTP. Please try again.");
            } else {
                setIsSuccess(true);

                // Handle custom organization creation if user entered one on register form
                if (typeof window !== "undefined") {
                    const customOrgName = localStorage.getItem("pending_org_name");

                    if (customOrgName) {
                        try {
                            const orgRes = await authClient.organization.create({
                                name: customOrgName,
                                slug: `${generateSlug(customOrgName)}-${Math.random().toString(36).slice(2, 6)}`,
                            });
                            if (orgRes.data?.id) {
                                await authClient.organization.setActive({
                                    organizationId: orgRes.data.id,
                                });
                            }
                        } catch (orgErr) {
                            console.log("Custom organization creation notice:", orgErr);
                        }
                    }

                    localStorage.removeItem("pending_verification_email");
                    localStorage.removeItem("pending_org_name");
                    localStorage.removeItem("pending_first_name");
                }

                setTimeout(() => {
                    router.push("/dashboard");
                }, 1500);
            }
        } catch (error) {
            if (error instanceof Error) {
                setApiError(error.message);
            } else {
                setApiError("An unexpected error occurred during verification.");
            }
        } finally {
            setIsLoading(false);
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