'use client';

import React from 'react';
import { FileText, RefreshCw, AlertTriangle, CheckCircle, File, Eye, Upload, FileSearch, ClipboardCheck, Verified, Download, MoreVertical } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="p-4 md:p-8 flex-1 flex flex-col gap-6 max-w-[1440px] mx-auto w-full">

            {/* Welcome Section */}
            <section>
                <h3 className="font-headline-lg text-headline-lg lg:font-headline-xl lg:text-headline-xl font-bold text-text-primary mb-2">
                    Good morning, Alex.
                </h3>
                <p className="text-body-lg font-body-lg text-secondary">
                    Here's what's happening with your documents today.
                </p>
            </section>

            {/* KPI Cards Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total */}
                <div className="bg-surface border border-border-subtle rounded-lg p-6 hover:border-primary transition-colors duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-label-md font-label-md text-secondary">Total Documents</p>
                        <FileText className="text-secondary w-6 h-6" />
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="font-headline-xl text-headline-xl font-bold text-text-primary">1,248</span>
                        <span className="text-label-sm font-label-sm text-tertiary-container bg-tertiary-container/10 px-2 py-1 rounded-full mb-1">+12%</span>
                    </div>
                </div>

                {/* Processing */}
                <div className="bg-surface border border-border-subtle rounded-lg p-6 hover:border-primary transition-colors duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-label-md font-label-md text-secondary">Processing</p>
                        <RefreshCw className="text-primary w-6 h-6" />
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="font-headline-xl text-headline-xl font-bold text-text-primary">24</span>
                    </div>
                </div>

                {/* Needs Verification */}
                <div className="bg-surface border border-warning rounded-lg p-6 shadow-[0_0_0_1px_rgba(245,158,11,0.2)] hover:border-warning/80 transition-colors duration-200 relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-16 h-16 bg-warning/5 rounded-bl-full pointer-events-none"></div>
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-label-md font-label-md text-warning font-semibold">Needs Verification</p>
                        <AlertTriangle className="text-warning w-6 h-6" />
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="font-headline-xl text-headline-xl font-bold text-text-primary">18</span>
                    </div>
                </div>

                {/* Processed */}
                <div className="bg-surface border border-border-subtle rounded-lg p-6 hover:border-primary transition-colors duration-200">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-label-md font-label-md text-secondary">Processed</p>
                        <CheckCircle className="text-tertiary-container w-6 h-6" />
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="font-headline-xl text-headline-xl font-bold text-text-primary">1,206</span>
                    </div>
                </div>
            </section>

            {/* Middle Section: Chart & Attention Card */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area */}
                <div className="lg:col-span-2 bg-surface border border-border-subtle rounded-lg p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-headline-md text-headline-md font-bold text-text-primary">Processing Overview</h4>
                        <select className="bg-surface border border-border-subtle rounded-md text-body-sm font-body-sm py-1 pl-3 pr-8 focus:border-primary focus:ring-1 focus:ring-primary outline-none">
                            <option>Last 30 Days</option>
                            <option>Last 7 Days</option>
                            <option>This Year</option>
                        </select>
                    </div>
                    {/* Placeholder for Chart */}
                    <div className="flex-1 bg-surface-container-low rounded-md border border-border-subtle flex items-center justify-center min-h-[300px] relative overflow-hidden">
                        <div className="absolute inset-0 flex items-end px-4 pt-10 pb-4 gap-2">
                            {/* Faux Chart Bars/Line */}
                            <div className="w-full h-full flex items-end justify-between gap-1 opacity-20">
                                <div className="w-full bg-primary rounded-t-sm" style={{ height: "40%" }}></div>
                                <div className="w-full bg-primary rounded-t-sm" style={{ height: "50%" }}></div>
                                <div className="w-full bg-primary rounded-t-sm" style={{ height: "30%" }}></div>
                                <div className="w-full bg-primary rounded-t-sm" style={{ height: "60%" }}></div>
                                <div className="w-full bg-primary rounded-t-sm" style={{ height: "80%" }}></div>
                                <div className="w-full bg-primary rounded-t-sm" style={{ height: "45%" }}></div>
                                <div className="w-full bg-primary rounded-t-sm" style={{ height: "70%" }}></div>
                                <div className="w-full bg-primary rounded-t-sm" style={{ height: "90%" }}></div>
                                <div className="w-full bg-primary rounded-t-sm" style={{ height: "55%" }}></div>
                                <div className="w-full bg-primary rounded-t-sm" style={{ height: "65%" }}></div>
                                <div className="w-full bg-primary rounded-t-sm" style={{ height: "75%" }}></div>
                                <div className="w-full bg-primary rounded-t-sm" style={{ height: "85%" }}></div>
                            </div>
                        </div>
                        <span className="text-secondary font-label-md text-label-md z-10 bg-surface px-3 py-1 rounded-full shadow-sm border border-border-subtle">Line Chart Visualization Space</span>
                    </div>
                </div>

                {/* Requires Attention & Distribution */}
                <div className="flex flex-col gap-6">
                    {/* Attention Card */}
                    <div className="bg-surface border border-warning/50 rounded-lg p-6 shadow-[0_2px_8px_-2px_rgba(245,158,11,0.15)]">
                        <h4 className="font-headline-md text-headline-md font-bold text-text-primary mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-warning w-5 h-5" />
                            Requires Attention
                        </h4>
                        <div className="bg-surface-container-low rounded-md p-4 border border-border-subtle mb-4">
                            <div className="flex items-start gap-3">
                                <File className="text-secondary mt-1 w-5 h-5" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-label-md text-label-md text-text-primary truncate font-medium">acme_invoice_march.pdf</p>
                                    <p className="text-body-sm font-body-sm text-secondary mt-1">Confidence score below threshold (82.1%). Manual review required for 2 fields.</p>
                                </div>
                            </div>
                        </div>
                        <button className="w-full bg-surface border border-border-subtle text-text-primary hover:bg-surface-container-low rounded-md py-2 px-4 font-label-md text-label-md transition-colors flex items-center justify-center gap-2">
                            <Eye className="w-4 h-4" />
                            Review Document
                        </button>
                    </div>

                    {/* Distribution */}
                    <div className="bg-surface border border-border-subtle rounded-lg p-6 flex-1">
                        <h4 className="font-headline-md text-headline-md font-bold text-text-primary mb-4">Document Types</h4>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-label-sm font-label-sm mb-1">
                                    <span className="text-text-primary">Invoices</span>
                                    <span className="text-secondary">62%</span>
                                </div>
                                <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-primary h-1.5 rounded-full" style={{ width: "62%" }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-label-sm font-label-sm mb-1">
                                    <span className="text-text-primary">Receipts</span>
                                    <span className="text-secondary">24%</span>
                                </div>
                                <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-tertiary-container h-1.5 rounded-full" style={{ width: "24%" }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-label-sm font-label-sm mb-1">
                                    <span className="text-text-primary">Contracts</span>
                                    <span className="text-secondary">10%</span>
                                </div>
                                <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-secondary h-1.5 rounded-full" style={{ width: "10%" }}></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-label-sm font-label-sm mb-1">
                                    <span className="text-text-primary">Other</span>
                                    <span className="text-secondary">4%</span>
                                </div>
                                <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-outline h-1.5 rounded-full" style={{ width: "4%" }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Processing Pipeline Flow */}
            <section className="bg-surface border border-border-subtle rounded-lg p-6 overflow-x-auto">
                <h4 className="font-headline-md text-headline-md font-bold text-text-primary mb-6">Processing Pipeline</h4>
                <div className="flex items-center min-w-[800px] justify-between relative px-4">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-10 right-10 h-px bg-border-subtle -translate-y-1/2 z-0"></div>

                    {/* Steps */}
                    <div className="relative z-10 flex flex-col items-center gap-2 bg-surface px-2">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-border-subtle text-secondary">
                            <Upload className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                            <p className="font-label-md text-label-md text-text-primary">Uploaded</p>
                            <p className="font-body-sm text-body-sm text-secondary font-medium">124</p>
                        </div>
                    </div>
                    <div className="relative z-10 flex flex-col items-center gap-2 bg-surface px-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                            <RefreshCw className="w-5 h-5 animate-spin-slow" />
                        </div>
                        <div className="text-center">
                            <p className="font-label-md text-label-md text-text-primary">Processing</p>
                            <p className="font-body-sm text-body-sm text-secondary font-medium">24</p>
                        </div>
                    </div>
                    <div className="relative z-10 flex flex-col items-center gap-2 bg-surface px-2">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-border-subtle text-secondary">
                            <FileSearch className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                            <p className="font-label-md text-label-md text-text-primary">Extracted</p>
                            <p className="font-body-sm text-body-sm text-secondary font-medium">1,156</p>
                        </div>
                    </div>
                    <div className="relative z-10 flex flex-col items-center gap-2 bg-surface px-2">
                        <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center border border-warning/20 text-warning">
                            <ClipboardCheck className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                            <p className="font-label-md text-label-md text-text-primary">Needs Verif.</p>
                            <p className="font-body-sm text-body-sm text-warning font-medium">18</p>
                        </div>
                    </div>
                    <div className="relative z-10 flex flex-col items-center gap-2 bg-surface px-2">
                        <div className="w-10 h-10 rounded-full bg-tertiary-container/10 flex items-center justify-center border border-tertiary-container/20 text-tertiary-container">
                            <Verified className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                            <p className="font-label-md text-label-md text-text-primary">Verified</p>
                            <p className="font-body-sm text-body-sm text-secondary font-medium">1,138</p>
                        </div>
                    </div>
                    <div className="relative z-10 flex flex-col items-center gap-2 bg-surface px-2">
                        <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-border-subtle text-secondary">
                            <Download className="w-5 h-5" />
                        </div>
                        <div className="text-center">
                            <p className="font-label-md text-label-md text-text-primary">Exported</p>
                            <p className="font-body-sm text-body-sm text-secondary font-medium">1,120</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Table Section */}
            <section className="bg-surface border border-border-subtle rounded-lg overflow-hidden">
                <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface">
                    <h4 className="font-headline-md text-headline-md font-bold text-text-primary">Recent Documents</h4>
                    <button className="text-primary font-label-md text-label-md hover:underline">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border-subtle bg-surface-container-low text-secondary font-label-sm text-label-sm uppercase tracking-wider">
                                <th className="p-4 font-medium">Document</th>
                                <th className="p-4 font-medium">Type</th>
                                <th className="p-4 font-medium">Uploaded</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Confidence</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="text-body-sm font-body-sm">
                            <tr className="border-b border-border-subtle hover:bg-surface-bright transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <FileText className="text-secondary w-5 h-5" />
                                        <span className="font-medium text-text-primary">invoice_2026_001.pdf</span>
                                    </div>
                                </td>
                                <td className="p-4 text-secondary">Invoice</td>
                                <td className="p-4 text-secondary">10 mins ago</td>
                                <td className="p-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-tertiary-container/10 text-tertiary-container border border-tertiary-container/20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span>
                                        Verified
                                    </span>
                                </td>
                                <td className="p-4 text-text-primary">98.5%</td>
                                <td className="p-4 text-right">
                                    <button className="text-secondary hover:text-primary transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                            <tr className="border-b border-border-subtle hover:bg-surface-bright transition-colors group bg-warning/5">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="text-warning w-5 h-5" />
                                        <span className="font-medium text-text-primary">acme_invoice_march.pdf</span>
                                    </div>
                                </td>
                                <td className="p-4 text-secondary">Invoice</td>
                                <td className="p-4 text-secondary">45 mins ago</td>
                                <td className="p-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-warning/10 text-warning border border-warning/20 font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
                                        Needs Verification
                                    </span>
                                </td>
                                <td className="p-4 text-text-primary font-medium">82.1%</td>
                                <td className="p-4 text-right">
                                    <button className="text-primary font-label-md text-label-md hover:underline">Review</button>
                                </td>
                            </tr>
                            <tr className="hover:bg-surface-bright transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <FileText className="text-secondary w-5 h-5" />
                                        <span className="font-medium text-text-primary">office_receipt_032.pdf</span>
                                    </div>
                                </td>
                                <td className="p-4 text-secondary">Receipt</td>
                                <td className="p-4 text-secondary">1 hour ago</td>
                                <td className="p-4">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-label-sm bg-primary/10 text-primary border border-primary/20">
                                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                        Processing
                                    </span>
                                </td>
                                <td className="p-4 text-secondary italic">Calculating...</td>
                                <td className="p-4 text-right">
                                    <button className="text-secondary hover:text-primary transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}