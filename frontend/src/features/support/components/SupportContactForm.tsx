"use client";

import React from "react";
import { Send, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSupportTicket } from "../hooks/useSupportTicket";

export const SupportContactForm: React.FC = () => {
    const {
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
    } = useSupportTicket();

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <LifeBuoy className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-slate-900">Open a Support Ticket</h2>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Category</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                            <option value="general">General Inquiries</option>
                            <option value="extraction">Document OCR & AI Extraction</option>
                            <option value="templates">Template Design & Schema</option>
                            <option value="billing">Team & Organization Access</option>
                            <option value="api">REST API & Webhooks</option>
                        </select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700">Priority</label>
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer"
                        >
                            <option value="low">Low (General guidance)</option>
                            <option value="medium">Medium (Standard priority)</option>
                            <option value="high">High (Production blocked)</option>
                            <option value="urgent">Urgent (Service degradation)</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Subject</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief summary of the issue or question"
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Detailed Message</label>
                    <textarea
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Please include document IDs, template formats, or error logs if applicable..."
                        className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y"
                    />
                </div>

                <div className="flex justify-end pt-1">
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="text-xs sm:text-sm font-semibold gap-1.5 py-2 px-4 cursor-pointer"
                    >
                        <Send className="w-4 h-4" />
                        <span>{isSubmitting ? "Submitting Ticket..." : "Submit Ticket"}</span>
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default SupportContactForm;
