import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

const MAX_RESENDS = 3;
const COOLDOWN_SECONDS = 60;

export const useResendOTP = (initialEmail?: string) => {
    const searchParams = useSearchParams();
    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState("");
    const [resendError, setResendError] = useState("");

    const [timeLeft, setTimeLeft] = useState(0);
    const [resendCount, setResendCount] = useState(0);

    const email = (initialEmail && initialEmail.includes("@") && initialEmail !== "your email")
        ? initialEmail
        : searchParams?.get("email")
        || (typeof window !== "undefined" ? localStorage.getItem("pending_verification_email") : "")
        || "";

    // Initialize from localStorage to persist limits across reloads
    useEffect(() => {
        if (!email) return;
        const storageKey = `resend_state_${email}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setResendCount(parsed.count || 0);

                if (parsed.lastResendAt) {
                    const elapsed = Math.floor((Date.now() - parsed.lastResendAt) / 1000);
                    if (elapsed < COOLDOWN_SECONDS) {
                        setTimeLeft(COOLDOWN_SECONDS - elapsed);
                    }
                }
            } catch (e) {
                console.error("Failed to parse resend state from storage");
            }
        }
    }, [email]);

    // Timer logic
    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const handleResend = async (targetEmail?: string) => {
        const resolvedEmail = (targetEmail && targetEmail.includes("@")) ? targetEmail : email;

        if (!resolvedEmail) {
            setResendError("Email address is required to resend OTP.");
            return;
        }

        if (resendCount >= MAX_RESENDS) {
            setResendError("Maximum resend attempts reached. Please register again.");
            return;
        }

        if (timeLeft > 0) return;

        setResendError("");
        setResendSuccess("");
        setIsResending(true);

        try {
            const res = await authClient.emailOtp.sendVerificationOtp({
                email: resolvedEmail.trim().toLowerCase(),
                type: "email-verification",
            });

            if (res.error) {
                setResendError(res.error.message || "Failed to resend code.");
            } else {
                setResendSuccess("A new verification code has been sent!");

                const newCount = resendCount + 1;
                setResendCount(newCount);
                setTimeLeft(COOLDOWN_SECONDS);

                localStorage.setItem(`resend_state_${resolvedEmail}`, JSON.stringify({
                    count: newCount,
                    lastResendAt: Date.now()
                }));
            }
        } catch (err: any) {
            setResendError(err?.message || "Failed to resend code");
        } finally {
            setIsResending(false);
        }
    };

    return {
        handleResend,
        isResending,
        resendSuccess,
        resendError,
        timeLeft,
        resendCount,
        maxReached: resendCount >= MAX_RESENDS
    };
};
