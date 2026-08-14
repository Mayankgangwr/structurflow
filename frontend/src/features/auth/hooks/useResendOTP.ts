import { useState, useEffect } from "react";
import { useResendOTPMutation } from "../authApi";

const MAX_RESENDS = 2;
const COOLDOWN_SECONDS = 60;

export const useResendOTP = (email: string) => {
    const [resendOTP, { isLoading: isResending }] = useResendOTPMutation();
    const [resendSuccess, setResendSuccess] = useState("");
    const [resendError, setResendError] = useState("");

    const [timeLeft, setTimeLeft] = useState(0);
    const [resendCount, setResendCount] = useState(0);

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

    const handleResend = async (token: string) => {
        if (resendCount >= MAX_RESENDS) {
            setResendError("Maximum resend attempts reached. Please register again.");
            return;
        }

        if (timeLeft > 0) return;

        setResendError("");
        setResendSuccess("");
        try {
            await resendOTP({ token }).unwrap();
            setResendSuccess("A new code has been sent!");

            const newCount = resendCount + 1;
            setResendCount(newCount);
            setTimeLeft(COOLDOWN_SECONDS);

            localStorage.setItem(`resend_state_${email}`, JSON.stringify({
                count: newCount,
                lastResendAt: Date.now()
            }));

        } catch (err: any) {
            setResendError(err.message || "Failed to resend code");
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
