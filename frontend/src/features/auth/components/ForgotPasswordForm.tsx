"use client";

import React from "react";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { Loader2, Mail, Send } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const ForgotPasswordForm: React.FC = () => {
    const {
        form,
        isLoading,
        apiError,
        isSuccess,
        onSubmit
    } = useForgotPassword();

    const { register, formState: { errors, isValid, isDirty }, reset } = form;

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center mb-md text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-md">
                    <Mail className="w-8 h-8" />
                </div>
                <h1 className="text-[24px] leading-7.5 font-bold tracking-[-0.01em] md:text-[30px] md:leading-9 md:tracking-[-0.02em] text-on-background">
                    Check your email
                </h1>
                <p className="text-on-surface-variant text-[15px] leading-5 mt-sm mb-6">
                    If an account exists, a password reset link has been sent to your email.
                </p>
                <Link href="/login" className="w-full">
                    <Button className="w-full h-11 md:h-10 text-[13px] leading-[16px] font-semibold shadow-md transition-all text-white rounded bg-[#1877F2] hover:opacity-90 hover:shadow-lg">
                        Back to Login
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col items-center mb-md text-center">
                <div className="w-16 h-16 bg-primary-container text-white rounded-full flex items-center justify-center mb-md">
                    <Mail className="w-8 h-8" />
                </div>
                <h1 className="text-[24px] leading-7.5 font-bold tracking-[-0.01em] md:text-[30px] md:leading-9 md:tracking-[-0.02em] text-on-background">
                    Forgot Password?
                </h1>
                <p className="text-on-surface-variant text-[15px] leading-5 mt-sm">
                    Enter your email to receive a password reset link
                </p>
                <div className="mt-md mb-xs h-px w-full bg-gray-200" />
            </div>

            <form onSubmit={onSubmit} className="w-full flex flex-col gap-4 text-left">
                {apiError && <p className="text-sm text-red-500 text-center font-medium animate-in fade-in">{apiError}</p>}
                
                <div className="space-y-1">
                    <Label htmlFor="email" className="text-zinc-600 dark:text-zinc-300 ml-1">Email Address</Label>
                    <Input
                        id="email"
                        type="text"
                        placeholder="username@example.com"
                        className={clsx("h-11 md:h-10 px-3 text-[13px] leading-[16px] bg-white/50 focus:bg-white transition-colors border-white/40 shadow-sm rounded", errors.email && "border-red-500 focus-visible:ring-red-500")}
                        {...register("email")}
                    />
                    {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>}
                </div>

                <div className="flex gap-3 w-full mt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => reset()}
                        disabled={!isDirty || isLoading}
                        className="w-1/3 h-11 md:h-10 text-[13px] leading-[16px] font-semibold shadow-sm transition-all rounded"
                    >
                        Reset
                    </Button>
                    <Button
                        disabled={!isValid || !isDirty || isLoading}
                        type="submit"
                        variant="default"
                        className={clsx(
                            "w-2/3 h-11 md:h-10 text-[13px] leading-[16px] font-semibold shadow-md transition-all text-white rounded flex items-center justify-center gap-2",
                            (isValid && isDirty) ? "bg-[#1877F2] hover:opacity-90 hover:shadow-lg" : "bg-[#1877F2] opacity-50 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...</>
                        ) : (
                            <><Send className="mr-2 h-5 w-5" /> Send Link</>
                        )}
                    </Button>
                </div>
            </form>

            <p className="text-sm text-muted-foreground mt-6 text-center">
                Remember your password?{" "}
                <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                    Log in
                </Link>
            </p>
        </>
    )
}
