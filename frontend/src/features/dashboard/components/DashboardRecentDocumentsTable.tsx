"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    FileText,
    FileImage,
    ArrowUpRight,
    CheckCircle2,
    AlertTriangle,
    Clock,
    FolderKanban,
    UploadCloud,
    ExternalLink,
    List,
    LayoutGrid,
} from "lucide-react";
import { Document } from "@/features/documents/documentApi";
import { formatSize, cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/features/auth/hooks/usePermissions";

interface DashboardRecentDocumentsTableProps {
    documents: (Document & { projectId?: { _id: string; name: string } | string })[];
    isLoading?: boolean;
    defaultViewMode?: "table" | "grid";
}

export const DashboardRecentDocumentsTable: React.FC<DashboardRecentDocumentsTableProps> = ({
    documents,
    isLoading,
    defaultViewMode = "table",
}) => {
    const { can } = usePermissions();
    const [viewMode, setViewMode] = useState<"table" | "grid">(defaultViewMode);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            UPLOADED: "bg-blue-50 text-blue-700 border-blue-200/80",
            PROCESSING: "bg-amber-50 text-amber-700 border-amber-200/80",
            TRANSFORMED: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
            VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
            EXPORTED: "bg-teal-50 text-teal-700 border-teal-200/80",
            REVIEW_REQUIRED: "bg-amber-50 text-amber-700 border-amber-300",
            REJECTED: "bg-rose-50 text-rose-700 border-rose-200/80",
            FAILED: "bg-rose-50 text-rose-700 border-rose-200/80",
        };

        return (
            <span
                className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-tight",
                    styles[status] || "bg-slate-100 text-slate-700 border-slate-200"
                )}
            >
                {status?.replaceAll("_", " ")}
            </span>
        );
    };

    const getFileIcon = (mimeType?: string) => {
        if (mimeType?.includes("image")) {
            return <FileImage className="w-4 h-4 text-purple-600" />;
        }
        return <FileText className="w-4 h-4 text-indigo-600" />;
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col h-full overflow-hidden">
            {/* Table / Grid Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                        <FileText className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                            Recent Ingested Documents
                        </h2>
                        <p className="text-xs text-slate-500">
                            Live stream of incoming files processed across projects
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    {/* Table / Grid Switcher */}
                    <div className="flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 shrink-0">
                        <button
                            type="button"
                            onClick={() => setViewMode("table")}
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
                                viewMode === "table"
                                    ? "bg-white text-primary shadow-xs border border-slate-200"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                            )}
                            title="Table View"
                        >
                            <List className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline text-[11px]">Table</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            className={cn(
                                "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
                                viewMode === "grid"
                                    ? "bg-white text-primary shadow-xs border border-slate-200"
                                    : "text-slate-500 hover:text-slate-800 hover:bg-white/60"
                            )}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline text-[11px]">Grid</span>
                        </button>
                    </div>

                    <Link
                        href="/documents"
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors shrink-0"
                    >
                        <span>View All</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            {/* Table / Grid Body */}
            <div className="flex-1 overflow-x-auto">
                {isLoading ? (
                    viewMode === "table" ? (
                        <div className="p-4 space-y-3">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50 animate-pulse"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-200 rounded-lg" />
                                        <div className="space-y-1.5">
                                            <div className="w-40 h-3.5 bg-slate-200 rounded" />
                                            <div className="w-24 h-2.5 bg-slate-200 rounded" />
                                        </div>
                                    </div>
                                    <div className="w-16 h-5 bg-slate-200 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div
                                    key={i}
                                    className="h-40 rounded-xl border border-slate-100 bg-slate-50/50 animate-pulse"
                                />
                            ))}
                        </div>
                    )
                ) : documents.length === 0 ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center my-auto">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                            <UploadCloud className="w-6 h-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">No documents ingested yet</h3>
                        <p className="text-xs text-slate-500 max-w-full mt-1 leading-relaxed">
                            Upload your first batch of documents to initiate automated schema extraction and OCR processing.
                        </p>
                        {can("upload_documents") && (
                            <Link href="/documents">
                                <Button size="sm" className="mt-4 text-xs cursor-pointer">
                                    <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                                    Upload Documents
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : viewMode === "table" ? (
                    /* TABLE VIEW */
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                                <th className="py-2.5 px-4">Document</th>
                                <th className="py-2.5 px-3 hidden sm:table-cell">Project</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3 hidden md:table-cell">Ingested</th>
                                <th className="py-2.5 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {documents.map((doc) => {
                                const docName =
                                    doc.originalFileName || doc.originalFilename || "Untitled Document";
                                const projectName =
                                    typeof doc.projectId === "object" && doc.projectId?.name
                                        ? doc.projectId.name
                                        : "General";

                                const timeAgo = doc.createdAt
                                    ? formatDistanceToNow(new Date(doc.createdAt), {
                                        addSuffix: true,
                                    })
                                    : "recently";

                                const needsReview =
                                    doc.status === "TRANSFORMED" || doc.status === "REVIEW_REQUIRED";

                                return (
                                    <tr
                                        key={doc._id}
                                        className="hover:bg-slate-50/80 transition-colors group"
                                    >
                                        {/* Document Name + Size */}
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2.5 min-w-0 max-w-[220px] sm:max-w-[280px]">
                                                <div className="p-1.5 rounded-md bg-slate-100 shrink-0">
                                                    {getFileIcon(doc.mimeType)}
                                                </div>
                                                <div className="truncate">
                                                    <div
                                                        className="font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors"
                                                        title={docName}
                                                    >
                                                        {docName}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">
                                                        {doc.sizeBytes ? formatSize(doc.sizeBytes) : "Document"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Project Tag */}
                                        <td className="py-3 px-3 hidden sm:table-cell">
                                            <div className="flex items-center gap-1 text-slate-600 max-w-[140px] truncate">
                                                <FolderKanban className="w-3 h-3 text-slate-400 shrink-0" />
                                                <span className="truncate">{projectName}</span>
                                            </div>
                                        </td>

                                        {/* Status Badge */}
                                        <td className="py-3 px-3">{getStatusBadge(doc.status)}</td>

                                        {/* Timestamp */}
                                        <td className="py-3 px-3 hidden md:table-cell text-slate-500 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                <span>{timeAgo}</span>
                                            </div>
                                        </td>

                                        {/* Action Button */}
                                        <td className="py-3 px-4 text-right">
                                            {needsReview && can("verify_documents") ? (
                                                <Link href="/verification">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 px-2.5 text-[11px] font-semibold text-amber-700 bg-amber-50/80 border-amber-300 hover:bg-amber-100 hover:text-amber-800 transition-colors cursor-pointer"
                                                    >
                                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                                        Review
                                                    </Button>
                                                </Link>
                                            ) : (
                                                <Link href="/documents">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 px-2 text-[11px] text-slate-500 hover:text-slate-900 cursor-pointer"
                                                    >
                                                        <span>View</span>
                                                        <ExternalLink className="w-3 h-3 ml-1" />
                                                    </Button>
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                ) : (
                    /* GRID VIEW */
                    <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                        {documents.map((doc) => {
                            const docName =
                                doc.originalFileName || doc.originalFilename || "Untitled Document";
                            const projectName =
                                typeof doc.projectId === "object" && doc.projectId?.name
                                    ? doc.projectId.name
                                    : "General";

                            const timeAgo = doc.createdAt
                                ? formatDistanceToNow(new Date(doc.createdAt), {
                                    addSuffix: true,
                                })
                                : "recently";

                            const needsReview =
                                doc.status === "TRANSFORMED" || doc.status === "REVIEW_REQUIRED";

                            return (
                                <div
                                    key={doc._id}
                                    className="bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-4 flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all group"
                                >
                                    <div>
                                        {/* Top: Icon + Status */}
                                        <div className="flex items-start justify-between gap-2 mb-2.5">
                                            <div className="p-2 rounded-lg bg-slate-100 shrink-0 group-hover:bg-indigo-50 transition-colors">
                                                {getFileIcon(doc.mimeType)}
                                            </div>
                                            {getStatusBadge(doc.status)}
                                        </div>

                                        {/* Title & Project */}
                                        <div className="mb-2">
                                            <h4
                                                className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors"
                                                title={docName}
                                            >
                                                {docName}
                                            </h4>
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1 truncate">
                                                <FolderKanban className="w-3 h-3 text-slate-400 shrink-0" />
                                                <span className="truncate">{projectName}</span>
                                            </div>
                                        </div>

                                        {/* Meta: Size & Time */}
                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                                            <span>{doc.sizeBytes ? formatSize(doc.sizeBytes) : "Document"}</span>
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-slate-400" />
                                                <span>{timeAgo}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end">
                                        {needsReview && can("verify_documents") ? (
                                            <Link href="/verification" className="w-full">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full h-7 text-[11px] font-semibold text-amber-700 bg-amber-50/80 border-amber-300 hover:bg-amber-100 hover:text-amber-800 transition-colors cursor-pointer flex items-center justify-center gap-1"
                                                >
                                                    <AlertTriangle className="w-3 h-3" />
                                                    <span>Review</span>
                                                </Button>
                                            </Link>
                                        ) : (
                                            <Link href="/documents" className="w-full">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="w-full h-7 text-[11px] text-slate-600 hover:text-slate-900 border border-slate-200/70 hover:bg-slate-50 cursor-pointer flex items-center justify-center gap-1"
                                                >
                                                    <span>View</span>
                                                    <ExternalLink className="w-3 h-3" />
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardRecentDocumentsTable;
