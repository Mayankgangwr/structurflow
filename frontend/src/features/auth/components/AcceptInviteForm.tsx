"use client";

import React, { useEffect } from "react";
import { Loader2, LogIn, Network } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import clsx from "clsx";
import { PasswordInput } from "@/components/ui/PasswordInput";
import Link from "next/link"; import { Button } from "@/components/ui/button";
import { useAcceptInvite } from "../hooks/useAcceptInvite";
import { useSearchParams } from "next/navigation";

export const AcceptInviteForm: React.FC = () => {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";
    const {
        form,
        control,
        isLoading,
        isValid,
        isDirty,
        passwordValue,
        apiError,
        handleAcceptInvite
    } = useAcceptInvite();

    const { register, formState: { errors }, reset, watch, setValue } = form;

    // Warn before leaving if form is dirty
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty]);

    let strength = 0;
    if (passwordValue) {
        if (passwordValue.length >= 6) strength += 1;
        if (/[A-Z]/.test(passwordValue)) strength += 1;
        if (/[0-9]/.test(passwordValue) || /[^A-Za-z0-9]/.test(passwordValue)) strength += 1;
    }

    const getStrengthColor = () => {
        if (strength === 0) return "bg-gray-200 dark:bg-gray-700";
        if (strength === 1) return "bg-red-500";
        if (strength === 2) return "bg-yellow-500";
        return "bg-green-500";
    };

    const getStrengthText = () => {
        if (!passwordValue) return "";
        if (strength === 1) return "Weak";
        if (strength === 2) return "Fair";
        return "Strong";
    };

    const onSubmit = (data: any) => {
        handleAcceptInvite(token, data);
    };

    return (
        <>
            <div className="flex flex-col items-center mb-xl text-center">
                <div className="w-16 h-16 bg-primary-container text-white rounded-full flex items-center justify-center mb-md">
                    <Network className="w-8 h-8" />
                </div>
                <h1 className="text-[24px] leading-7.5 font-bold tracking-[-0.01em] md:text-[30px] md:leading-9 md:tracking-[-0.02em] text-on-background">
                    Create Account
                </h1>
                <p className="text-on-surface-variant text-[15px] leading-5 mt-sm">Join SocialCore today to connect with friends, share your moments, and discover new communities.</p>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-4 text-left">
                {apiError && <p className="text-sm text-red-500 text-center font-medium animate-in fade-in">{apiError}</p>}

                <div className="flex flex-col gap-4">
                    <div className="w-full space-y-1">
                        <Label htmlFor="firstName" className="text-zinc-600 dark:text-zinc-300 ml-1">First Name</Label>
                        <Input
                            id="firstName"
                            type="text"
                            placeholder="John"
                            className={clsx("h-11 md:h-10 px-3 text-[13px] leading-[16px] bg-white/50 focus:bg-white transition-colors border-white/40 shadow-sm rounded", errors.firstName && "border-red-500 focus-visible:ring-red-500")}
                            {...register("firstName")}
                        />
                        {errors.firstName && <p className="text-xs text-red-500 mt-1 ml-1">{errors.firstName.message}</p>}
                    </div>
                    <div className="w-full space-y-1">
                        <Label htmlFor="lastName" className="text-zinc-600 dark:text-zinc-300 ml-1">Last Name</Label>
                        <Input
                            id="lastName"
                            type="text"
                            placeholder="Doe"
                            className={clsx("h-11 md:h-10 px-3 text-[13px] leading-[16px] bg-white/50 focus:bg-white transition-colors border-white/40 shadow-sm rounded", errors.lastName && "border-red-500 focus-visible:ring-red-500")}
                            {...register("lastName")}
                        />
                        {errors.lastName && <p className="text-xs text-red-500 mt-1 ml-1">{errors.lastName.message}</p>}
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="password" className="text-zinc-600 dark:text-zinc-300 ml-1">Password</Label>
                        <PasswordInput
                            id="password"
                            placeholder="••••••••"
                            className={clsx("h-11 md:h-10 px-3 text-[13px] leading-[16px] bg-white/50 focus:bg-white transition-colors border-white/40 shadow-sm rounded", errors.password && "border-red-500 focus-visible:ring-red-500")}
                            {...register("password")}
                        />
                        {/* Password Strength Meter */}
                        {passwordValue && (
                            <div className="w-full flex items-center gap-2 mt-2 px-1 animate-in fade-in">
                                <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex gap-1">
                                    <div className={clsx("h-full w-1/3 transition-all duration-300", strength >= 1 ? getStrengthColor() : "bg-transparent")} />
                                    <div className={clsx("h-full w-1/3 transition-all duration-300", strength >= 2 ? getStrengthColor() : "bg-transparent")} />
                                    <div className={clsx("h-full w-1/3 transition-all duration-300", strength >= 3 ? getStrengthColor() : "bg-transparent")} />
                                </div>
                                <span className={clsx("text-xs font-medium w-12 text-right transition-colors",
                                    strength === 1 ? "text-red-500" :
                                        strength === 2 ? "text-yellow-600 dark:text-yellow-500" :
                                            strength === 3 ? "text-green-500" : "text-muted-foreground"
                                )}>
                                    {getStrengthText()}
                                </span>
                            </div>
                        )}
                        {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password.message}</p>}
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
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Creating...</>
                        ) : (
                            <><LogIn className="mr-2 h-5 w-5" /> Create Account</>
                        )}
                    </Button>
                </div>
            </form>

            <p className="text-sm text-muted-foreground mt-4 text-center">
                Already have an account?{" "}
                <Link href="/login" className="font-semibold text-blue-600 hover:underline">
                    Log In
                </Link>
            </p>
        </>
    )
}