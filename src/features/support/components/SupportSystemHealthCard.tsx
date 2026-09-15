"use client";

import React from "react";
import { useGetSystemHealthQuery } from "../supportApi";

export const SupportSystemHealthCard: React.FC = () => {
    const { data, isLoading } = useGetSystemHealthQuery();

    const healthData = data?.data;
    const isDegraded = healthData?.overallStatus === "DEGRADED";
    const isOperational = healthData?.overallStatus === "OPERATIONAL" || !isDegraded;
    const uptimeText = healthData?.uptimePercentage ? `All Systems ${healthData.uptimePercentage}` : "All Systems 99.98%";

    // Fallback services if query is pending or empty
    const services = healthData?.services && healthData.services.length > 0
        ? healthData.services
        : [
            { name: "AI Ingestion API", status: "Operational", metric: "99.99% Uptime" },
            { name: "Gemini 3.5 Gateway", status: "Normal", metric: "~1.2s avg latency" },
            { name: "Supabase Storage", status: "Online", metric: "S3 US-East" },
            { name: "Database Cluster", status: "Healthy", metric: "<25ms latency" },
        ];

    return (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                    <span
                        className={`w-2.5 h-2.5 rounded-full ${
                            isOperational ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                        }`}
                    />
                    <h2 className="text-sm font-bold text-slate-900">System Operational Status</h2>
                </div>
                <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                        isOperational
                            ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                            : "text-amber-600 bg-amber-50 border-amber-200"
                    }`}
                >
                    {isLoading ? "Checking Status..." : uptimeText}
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {services.map((service, index) => {
                    const isNormal = service.status === "Operational" || service.status === "Normal" || service.status === "Online" || service.status === "Healthy";
                    return (
                        <div key={service.name || index} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <span className="text-slate-500 block truncate">{service.name}</span>
                            <span className="font-bold text-slate-900 text-sm mt-0.5 block truncate">
                                {service.status}
                            </span>
                            <span
                                className={`text-[10px] mt-1 block truncate ${
                                    isNormal ? "text-emerald-600" : "text-amber-600"
                                }`}
                            >
                                {service.metric}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SupportSystemHealthCard;
