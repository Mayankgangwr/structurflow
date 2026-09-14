"use client";

import React from "react";
import { useResetPassword } from "../hooks/useResetPassword";
import { Loader2, Key, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/PasswordInput";
import clsx from "clsx";
import { Button } from "@/components/ui/button";

export const ResetPasswordForm: React.FC = () => {
    const {
        form,
        isLoading,
        apiError,
        isSuccess,
        onSubmit
    } = useResetPassword();

    const { register, formState: { errors, isValid, isDirty }, reset } = form;

    if (isSuccess) {
        return (
            <div className="flex flex-col items-center mb-md text-center">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-md">
                    <Key className="w-8 h-8" />
                </div>
                <h1 className="text-[24px] leading-7.5 font-bold tracking-[-0.01em] md:text-[30px] md:leading-9 md:tracking-[-0.02em] text-on-background">
                    Password Reset!
                </h1>
                <p className="text-on-surface-variant text-[15px] leading-5 mt-sm mb-6">
                    Your password has been successfully reset. Redirecting to login...
                </p>
                <div className="flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col items-center mb-md text-center">
                <div className="w-16 h-16 bg-primary-container text-white rounded-full flex items-center justify-center mb-md">
                    <Key className="w-8 h-8" />
                </div>
                <h1 className="text-[24px] leading-7.5 font-bold tracking-[-0.01em] md:text-[30px] md:leading-9 md:tracking-[-0.02em] text-on-background">
                    Reset Password
                </h1>
                <p className="text-on-surface-variant text-[15px] leading-5 mt-sm">
                    Please enter your new password
                </p>
                <div className="mt-md mb-xs h-px w-full bg-gray-200" />
            </div>

            <form onSubmit={onSubmit} className="w-full flex flex-col gap-4 text-left">
                {apiError && <p className="text-sm text-red-500 text-center font-medium animate-in fade-in">{apiError}</p>}
                
                <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="newPassword" className="text-zinc-600 dark:text-zinc-300 ml-1">New Password</Label>
                        <PasswordInput
                            id="newPassword"
                            placeholder="••••••••"
                            className={clsx("h-11 md:h-10 px-3 text-[13px] leading-[16px] bg-white/50 focus:bg-white transition-colors border-white/40 shadow-sm rounded", errors.newPassword && "border-red-500 focus-visible:ring-red-500")}
                            {...register("newPassword")}
                        />
                        {errors.newPassword && <p className="text-xs text-red-500 mt-1 ml-1">{errors.newPassword.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="confirmPassword" className="text-zinc-600 dark:text-zinc-300 ml-1">Confirm Password</Label>
                        <PasswordInput
                            id="confirmPassword"
                            placeholder="••••••••"
                            className={clsx("h-11 md:h-10 px-3 text-[13px] leading-[16px] bg-white/50 focus:bg-white transition-colors border-white/40 shadow-sm rounded", errors.confirmPassword && "border-red-500 focus-visible:ring-red-500")}
                            {...register("confirmPassword")}
                        />
                        {errors.confirmPassword && <p className="text-xs text-red-500 mt-1 ml-1">{errors.confirmPassword.message}</p>}
                    </div>
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
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</>
                        ) : (
                            <><Save className="mr-2 h-5 w-5" /> Save Password</>
                        )}
                    </Button>
                </div>
            </form>
        </>
    )
}
