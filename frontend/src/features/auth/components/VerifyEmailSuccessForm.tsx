"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import React, { Suspense } from "react";
import Link from "next/link";
import { useVerifyOTP } from "../hooks/useVerifyOTP";

const VerifyEmailContent: React.FC = () => {
    const { isLoading, isSuccess, apiError } = useVerifyOTP();

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-10 animate-in fade-in duration-500">
                <Loader2 className="w-12 h-12 text-brand-primary animate-spin mb-md" />
                <h1 className="text-[20px] font-semibold text-on-surface">Verifying your email...</h1>
                <p className="text-[15px] text-on-surface-variant mt-2 text-center">Please wait while we confirm your email address.</p>
            </div>
        );
    }

    if (apiError || !isSuccess) {
        return (
            <>
                <div className="mb-xl flex justify-center">
                    <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center animate-in zoom-in duration-500">
                        <XCircle className="text-red-600 w-12 h-12" />
                    </div>
                </div>

                <div className="mb-xl text-center">
                    <h1 className="text-[24px] leading-7.5 tracking-[-0.01em] font-bold md:text-[30px] md:leading-[36px] md:tracking-[-0.02em] text-on-surface mb-md animate-in fade-in slide-in-from-bottom-2 duration-700">
                        Verification Failed
                    </h1>
                    <p className="text-[15px] leading-5 font-medium text-red-600 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150 fill-mode-both">
                        {apiError || "Something went wrong while verifying your email."}
                    </p>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300 fill-mode-both">
                    <Link
                        href="/login"
                        className="w-full h-11 md:h-10 bg-surface-container-low hover:bg-[#e4e6e9] text-on-surface text-[13px] leading-[16px] tracking-[0.01em] font-semibold rounded flex items-center justify-center transition-colors border border-outline-variant"
                    >
                        Back to Login
                    </Link>
                </div>
            </>
        );
    }

    // Success State
    return (
        <>
            {/* Illustration Area */}
            <div className="mb-xl flex justify-center">
                <div className="w-24 h-24 rounded-full bg-[#8bfa98] flex items-center justify-center animate-in zoom-in duration-500">
                    <CheckCircle2 className="text-[#00752d] w-12 h-12" />
                </div>
            </div>

            {/* Copy */}
            <div className="mb-xl text-center">
                <h1 className="text-[24px] leading-7.5 tracking-[-0.01em] font-bold md:text-[30px] md:leading-[36px] md:tracking-[-0.02em] text-on-surface mb-md animate-in fade-in slide-in-from-bottom-2 duration-700">
                    Account Verified!
                </h1>
                <p className="text-[15px] leading-5 font-normal text-on-surface-variant animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150 fill-mode-both">
                    You&apos;re all set. Welcome to the SocialCore community.
                </p>
            </div>

            {/* Actions */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300 fill-mode-both">
                <Link
                    href="/"
                    className="w-full h-11 md:h-10 bg-[#1877F2] hover:bg-primary-container text-white text-[13px] leading-[16px] tracking-[0.01em] font-semibold rounded flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
                >
                    Continue to Home
                </Link>
            </div>
        </>
    );
};

export const VerifyEmailSuccessForm: React.FC = () => {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
            </div>
        }>
            <VerifyEmailContent />
        </Suspense>
    );
};
