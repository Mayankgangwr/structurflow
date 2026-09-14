"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export const useSupportTicket = () => {
    const [subject, setSubject] = useState("");
    const [category, setCategory] = useState("general");
    const [priority, setPriority] = useState("medium");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmitTicket = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject.trim()) {
            toast.error("Please enter a ticket subject");
            return;
        }
        if (!message.trim() || message.trim().length < 10) {
            toast.error("Please provide detailed context (min 10 characters)");
            return;
        }

        setIsSubmitting(true);
        setTimeout(() => {
            const ticketId = "SF-" + Math.floor(1000 + Math.random() * 9000);
            setIsSubmitting(false);
            toast.success(`Support ticket #${ticketId} created! Our team will reply within 24 hours.`);
            setSubject("");
            setMessage("");
            setCategory("general");
            setPriority("medium");
        }, 600);
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
