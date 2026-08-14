"use client";

import React, { useEffect } from "react";
import { useLogin } from "../hooks/useLogin";
import { Loader2, LogIn, Network } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import clsx from "clsx";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Controller } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { SocialAuthButtons } from "./SocialAuthButtons";
import Link from "next/link";

export const LoginForm: React.FC = () => {
    const {
        form,
        control,
        isLoading,
        isValid,
        isDirty,
        apiError,
        onSubmit
    } = useLogin();

    const { register, formState: { errors }, reset } = form;

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload)
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [isDirty])

    return (
        <>
            <div className="flex flex-col items-center mb-md text-center">
                <div className="w-16 h-16 bg-primary-container text-white rounded-full flex items-center justify-center mb-md">
                    <Network className="w-8 h-8" />
                </div>
                <h1 className="text-[24px] leading-7.5 font-bold tracking-[-0.01em] md:text-[30px] md:leading-9 md:tracking-[-0.02em] text-on-background">
                    Welcome Back
                </h1>
                <p className="text-on-surface-variant text-[15px] leading-5 mt-sm">Enter your details to access your account</p>
                <div className="mt-md mb-xs h-px w-full bg-gray-200" />
            </div>

            <form onSubmit={onSubmit} className="w-full flex flex-col gap-4 text-left">
                {apiError && <p className="text-sm text-red-500 text-center font-medium animate-in fade-in">{apiError}</p>}
                <div className="flex flex-col gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="email" className="text-zinc-600 dark:text-zinc-300 ml-1">Username or Email</Label>
                        <Input
                            id="email"
                            type="text"
                            placeholder="username@example.com"
                            className={clsx("h-11 md:h-10 px-3 text-[13px] leading-[16px] bg-white/50 focus:bg-white transition-colors border-white/40 shadow-sm rounded", errors.email && "border-red-500 focus-visible:ring-red-500")}
                            {...register("email")}
                        />
                        {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="password" className="text-zinc-600 dark:text-zinc-300 ml-1">Password</Label>
                        <PasswordInput
                            id="password"
                            placeholder="••••••••"
                            className={clsx("h-11 md:h-10 px-3 text-[13px] leading-[16px] bg-white/50 focus:bg-white transition-colors border-white/40 shadow-sm rounded", errors.password && "border-red-500 focus-visible:ring-red-500")}
                            {...register("password")}
                        />
                        {errors.password && <p className="text-xs text-red-500 mt-1 ml-1">{errors.password.message}</p>}
                    </div>
                </div>

                <div className="flex justify-between items-center w-full px-1">
                    <Controller
                        name="rememberMe"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center space-x-2 cursor-pointer group">
                                <Checkbox
                                    id="rememberMe"
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                                <label
                                    htmlFor="rememberMe"
                                    className="text-sm font-medium text-muted-foreground group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors cursor-pointer"
                                >
                                    Remember me
                                </label>
                            </div>
                        )}
                    />
                    <Link
                        href="/forgot-password"
                        className="text-[13px] font-semibold text-blue-600 hover:underline transition-all"
                    >
                        Forgot password?
                    </Link>
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
                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Logging in...</>
                        ) : (
                            <><LogIn className="mr-2 h-5 w-5" /> Log In</>
                        )}
                    </Button>
                </div>
            </form>

            <div className="flex items-center gap-4 my-2 w-full px-2">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">or</span>
                <div className="h-px flex-1 bg-border/60" />
            </div>

            <SocialAuthButtons />

            <p className="text-sm text-muted-foreground mt-4 text-center">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-semibold text-blue-600 hover:underline">
                    Sign up
                </Link>
            </p>
        </>
    )
}