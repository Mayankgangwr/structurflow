import React from "react";
import { Eye, File, FileText, RefreshCw } from "lucide-react";
import { Template } from "@/features/templates/templateApi";
import { formatDate, formatSize, getFileType } from "@/lib/utils";
import UploadDocument from "./UploadDocument";
import DocumentEmptyState from "./DocumentEmptyState";
import { Document } from "@/features/documents/documentApi";

export interface IDocumentSectionProps {
    activeTemplate: Template;
    documentsResponse: Document[];
};

const DocumentSection: React.FC<IDocumentSectionProps> = ({ activeTemplate, documentsResponse }) => {


    if (!activeTemplate) return null;
    const { originalFileName, mimeType, sizeBytes, createdAt, status } = activeTemplate;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg lg:gap-xl mt-3 lg:mt-0">
            <div className="lg:col-span-8 flex flex-col gap-sm order-2 lg:order-1">
                {documentsResponse.length > 0 ? (
                    <div></div>
                ) : (
                    <>
                        {/* Upload Document */}
                        <UploadDocument projectId={activeTemplate.projectId} />
                        {/* Empty State */}
                        <DocumentEmptyState projectId={activeTemplate.projectId} />
                    </>
                )}
            </div>
            <div className="lg:col-span-4 flex flex-col gap-sm order-1 lg:order-2">
                <h2 className="font-headline-md text-headline-md text-text-primary">Active Template</h2>
                {/* Active template card */}
                <div
                    className="bg-surface border border-border-subtle rounded-md p-sm flex flex-col gap-xs hover:border-primary/30 transition-colors shadow-sm">
                    <div className="flex items-start gap-md">
                        <div className="p-sm bg-error-container/20 text-error rounded-lg shrink-0">
                            <File />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-label-md text-label-md text-text-primary truncate"
                                title={originalFileName}>{originalFileName}</h3>
                            <div
                                className="flex items-center gap-xs text-secondary font-label-sm text-label-sm mt-xs flex-wrap">
                                <span>{getFileType(mimeType, originalFileName)}</span>
                                <span>•</span>
                                <span>{formatSize(sizeBytes)}</span>
                                <span>•</span>
                                <span>Uploaded {formatDate(createdAt)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-subtle pt-xs mt-xs">
                        <span
                            className="inline-flex items-center gap-xs font-label-sm text-label-sm text-tertiary-container">
                            <span className="w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
                            Status: {status || 'Ready'}
                        </span>
                        <div className="flex items-center gap-sm">
                            <button
                                className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                                title="Preview">
                                <Eye />
                            </button>
                            <button
                                className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                                title="Replace">

                                <div className="relative">
                                    <FileText size={20} />
                                    <RefreshCw size={14} className="absolute -bottom-1 -right-1" />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
};

export default DocumentSection;