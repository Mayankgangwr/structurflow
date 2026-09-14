"use client";

import React, { useState } from "react";
import { CircleHelp, ChevronDown, ChevronUp } from "lucide-react";
import { faqs } from "../data/faqData";
import { cn } from "@/lib/utils";

export const SupportFaqAccordion: React.FC = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFaq = (index: number) => {
        setOpenFaqIndex((prev) => (prev === index ? null : index));
    };

    const setOpenFaqIndex = setOpenIndex;

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <CircleHelp className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-slate-900">Frequently Asked Questions</h2>
            </div>

            <div className="divide-y divide-slate-100">
                {faqs.map((faq, index) => {
                    const isOpen = openIndex === index;
                    return (
                        <div key={faq.id} className="py-3.5">
                            <button
                                onClick={() => toggleFaq(index)}
                                className="w-full flex items-center justify-between gap-3 text-left font-semibold text-xs sm:text-sm text-slate-800 hover:text-primary transition-colors cursor-pointer"
                            >
                                <span className="flex-1">{faq.question}</span>
                                {isOpen ? (
                                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                                )}
                            </button>
                            {isOpen && (
                                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed pr-6 animate-in fade-in duration-150">
                                    {faq.answer}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SupportFaqAccordion;
