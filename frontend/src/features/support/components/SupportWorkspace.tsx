"use client";

import React from "react";
import SupportHeroHeader from "./SupportHeroHeader";
import SupportQuickCards from "./SupportQuickCards";
import SupportFaqAccordion from "./SupportFaqAccordion";
import SupportContactForm from "./SupportContactForm";
import SupportSystemHealthCard from "./SupportSystemHealthCard";

export const SupportWorkspace: React.FC = () => {
    return (
        <div className="p-3 xs:p-5 sm:p-6 max-w-full mx-auto w-full space-y-3">
            {/* Hero Header */}
            <SupportHeroHeader />

            {/* Quick Cards Grid */}
            <SupportQuickCards />

            {/* Operational Status */}
            <SupportSystemHealthCard />

            {/* Main Content Grid: FAQ Accordion + Contact Ticket Form */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                <div className="lg:col-span-3">
                    <SupportFaqAccordion />
                </div>
                <div className="lg:col-span-2">
                    <SupportContactForm />
                </div>
            </div>
        </div>
    );
};

export default SupportWorkspace;
