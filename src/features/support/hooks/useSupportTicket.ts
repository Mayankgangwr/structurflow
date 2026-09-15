"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useCreateSupportTicketMutation } from "../supportApi";

export const useSupportTicket = () => {
    const [subject, setSubject] = useState("");
    const [category, setCategory] = useState("general");
    const [priority, setPriority] = useState("medium");
    const [message, setMessage] = useState("");

    const [createTicketMutation, { isLoading: isSubmitting }] = useCreateSupportTicketMutation();

    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedSubject = subject.trim();
        const trimmedMessage = message.trim();

        if (!trimmedSubject || trimmedSubject.length < 3) {
            toast.error("Please enter a ticket subject (min 3 characters)");
            return;
        }
        if (!trimmedMessage || trimmedMessage.length < 10) {
            toast.error("Please provide detailed context (min 10 characters)");
            return;
        }

        try {
            const response = await createTicketMutation({
                subject: trimmedSubject,
                category: category as any,
                priority: priority as any,
                message: trimmedMessage,
            }).unwrap();

            const ticketId = response.data?.ticketId || "SF-TICKET";
            const responseTime = response.data?.estimatedResponseTime || "within 24 hours";
            toast.success(`Support ticket #${ticketId} created! Our team will reply ${responseTime}.`);

            setSubject("");
            setMessage("");
            setCategory("general");
            setPriority("medium");
        } catch (error: any) {
            const errorMsg =
                error?.data?.message ||
                error?.message ||
                "Failed to submit ticket. Please try again.";
            toast.error(errorMsg);
        }
    };

    return {
        subject,
        setSubject,
        category,
        setCategory,
        priority,
        setPriority,
        message,
        setMessage,
        isSubmitting,
        handleSubmitTicket,
    };
};
