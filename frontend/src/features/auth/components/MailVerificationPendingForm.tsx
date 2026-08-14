"use client";

import { MailCheck, Loader2 } from "lucide-react";
import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useVerifyOTP } from "../hooks/useVerifyOTP";
import { useResendOTP } from "../hooks/useResendOTP";
import { Button } from "@/components/ui/button";

const VerifyEmailPendingFormContent: React.FC = () => {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";
    const email = searchParams.get("email") || "your email";
    const urlOtp = searchParams.get("otp") || "";

    const { form, isLoading, isValid, isDirty, apiError, isSuccess, handleVerify } = useVerifyOTP(urlOtp);
    const { register, formState: { errors } } = form;

    const {
        handleResend,
        isResending,
        resendSuccess,
        resendError,
        timeLeft,
        maxReached
    } = useResendOTP(email);

    // Auto-submit if the user came from an email magic link
    useEffect(() => {
        if (token && urlOtp) {
            handleVerify({ otp: urlOtp }, token);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Warn before leaving if form is dirty
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty && !isSuccess) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty, isSuccess]);

    const onSubmit = (data: any) => {
        handleVerify(data, token);
    };

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in duration-300">
                <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center relative mb-6">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-20"></div>
                    <svg className="w-12 h-12 text-green-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                </div>
                <h1 className="text-[24px] font-bold text-on-surface mb-2">Email Verified!</h1>
                <p className="text-[15px] text-on-surface-variant mb-6">Your account is ready. Redirecting you to your dashboard...</p>
                <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
            </div>
        );
    }

    return (
        <>
            {/* Illustration Area */}
            <div className="mb-xl flex justify-center">
                <div className="w-24 h-24 bg-primary-fixed rounded-full flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-primary-fixed-dim rounded-full animate-ping opacity-20"></div>
                    <MailCheck className="text-brand-primary w-12 h-12 relative z-10" />
                </div>
            </div>

            {/* Copy */}
            <div className="mb-xl text-center">
                <h1 className="text-[24px] leading-7.5 tracking-[-0.01em] font-bold md:text-[30px] md:leading-[36px] md:tracking-[-0.02em] text-on-surface mb-md">
                    Verify your email
                </h1>
                <p className="text-[15px] leading-5 font-normal text-on-surface-variant">
                    We&apos;ve sent a code to <span className="text-[13px] leading-[16px] tracking-[0.01em] font-semibold text-brand-primary">{email}</span>. Check your inbox to continue.
                </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-4 text-left">
                {apiError && <p className="text-sm text-red-500 text-center font-medium animate-in fade-in">{apiError}</p>}
                {resendError && <p className="text-sm text-red-500 text-center font-medium animate-in fade-in">{resendError}</p>}
                {resendSuccess && <p className="text-sm text-green-500 text-center font-medium animate-in fade-in">{resendSuccess}</p>}

                <div className="w-full space-y-1">
                    <Label htmlFor="otp" className="text-zinc-600 dark:text-zinc-300 ml-1">Verification Code</Label>
                    <Input
                        id="otp"
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        disabled={maxReached || isLoading}
                        className={clsx(
                            "h-11 md:h-10 px-3 text-center text-lg tracking-[0.5em] font-mono bg-white/50 focus:bg-white transition-colors border-white/40 shadow-sm rounded",
                            errors.otp && "border-red-500 focus-visible:ring-red-500",
                            (maxReached || isLoading) && "opacity-50 cursor-not-allowed"
                        )}
                        {...register("otp")}
                    />
                    {errors.otp && <p className="text-xs text-red-500 mt-1 ml-1 text-center">{errors.otp.message}</p>}
                </div>

                <div className="space-y-3 mt-4">
                    <Button
                        type="submit"
                        disabled={!isValid || !isDirty || isLoading || maxReached}
                        className={clsx(
                            "w-full h-11 md:h-10 text-[13px] leading-[16px] font-semibold shadow-md transition-all text-white rounded flex items-center justify-center gap-2",
                            (isValid && isDirty && !isLoading && !maxReached) ? "bg-[#1877F2] hover:opacity-90 hover:shadow-lg" : "bg-[#1877F2] opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
                        ) : (
                            "Verify Email"
                        )}
                    </Button>
                </div>
            </form>

            <div className="flex flex-col space-y-sm pt-4 w-full">
                {maxReached ? (
                    <Link
                        href="/register"
                        className="text-[13px] leading-[16px] tracking-[0.01em] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-sm rounded-md px-4 py-2 text-center w-full block"
                    >
                        Register Again
                    </Link>
                ) : (
                    <button
                        type="button"
                        disabled={isResending || timeLeft > 0 || isLoading}
                        className="text-[13px] leading-[16px] tracking-[0.01em] font-semibold text-gray-500 hover:text-brand-primary disabled:opacity-50 transition-colors bg-transparent border-none focus:outline-none flex items-center justify-center gap-2"
                        onClick={() => handleResend(token)}
                    >
                        {isResending ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                        ) : timeLeft > 0 ? (
                            `Resend code in ${timeLeft}s`
                        ) : (
                            "Didn't receive the code? Resend"
                        )}
                    </button>
                )}

                <Link
                    href="/login"
                    className="text-[13px] mt-4 leading-[16px] tracking-[0.01em] font-semibold text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none text-center block w-full"
                >
                    Back to Login
                </Link>
            </div>
        </>
    );
};

export const MailVerificationPendingForm: React.FC = () => {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-brand-primary" /></div>}>
            <VerifyEmailPendingFormContent />
        </Suspense>
    );
};
