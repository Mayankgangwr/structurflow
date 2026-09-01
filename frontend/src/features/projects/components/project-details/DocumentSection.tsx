import React, { useState } from "react";
import { Eye, File, FileText, RefreshCw } from "lucide-react";
import { Template } from "@/features/templates/templateApi";
import { formatDate, formatSize, getFileType } from "@/lib/utils";
import UploadDocument from "./UploadDocument";
import DocumentEmptyState from "./DocumentEmptyState";
import { Document } from "@/features/documents/documentApi";
import DocumentsSummary from "./DocumentsSummary";
import DocumentView from "./DocumentView";
import { Button } from "@base-ui/react/button";
import PdfPreviewDialog from "@/components/documents/PdfPreviewDialog";
import UploadTemplateForm from "@/features/templates/components/UploadTemplateForm";
import TemplateSchemaDialog from "@/features/templates/components/TemplateSchemaDialog";

export interface IDocumentSectionProps {
    activeTemplate: Template;
    hasDocuments: boolean;
};

const DocumentSection: React.FC<IDocumentSectionProps> = ({ activeTemplate, hasDocuments }) => {
    const [isPreveiwTemplte, setIsPreveiwTemplte] = useState(false);
    const [isReplaceTemplate, setIsReplaceTemplate] = useState(false);
    const [isSchemaViewerOpen, setIsSchemaViewerOpen] = useState(false);


    if (!activeTemplate) return null;
    const { originalFileName, mimeType, sizeBytes, createdAt, status } = activeTemplate;

    return (
        <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 gap-sm lg:gap-md mt-2 lg:mt-0 lg:min-h-100 h-full">
            <div className="lg:col-span-2 flex flex-col gap-sm order-2 lg:order-1 flex-1 lg:flex-none">
                {hasDocuments ? (
                    <DocumentView projectId={activeTemplate.projectId} />
                ) : (
                    <UploadDocument projectId={activeTemplate.projectId} />
                )}
            </div>
            <div className="lg:col-span-1 flex flex-col gap-sm order-1 lg:order-2">
                <>
                    <h2 className="font-headline-md text-headline-md text-text-primary">Active Template</h2>
                    {/* Active template card */}
                    <div className="bg-surface border border-border-subtle rounded-xl p-md flex flex-col gap-sm hover:border-primary/30 transition-colors shadow-sm">
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
                                {activeTemplate.targetSchema && (
                                    <Button
                                        onClick={() => setIsSchemaViewerOpen(true)}
                                        className="text-primary hover:bg-primary-container/50 bg-primary/10 transition-colors flex items-center justify-center py-1 px-3 text-[12px] font-semibold rounded-md"
                                        title="View Schema">
                                        View Schema
                                    </Button>
                                )}
                                <Button
                                    onClick={() => setIsPreveiwTemplte(true)}
                                    className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                                    title="Preview">
                                    <Eye />
                                </Button>
                                <Button
                                    className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                                    title="Replace"
                                    onClick={() => setIsReplaceTemplate(true)}
                                >
                                    <div className="relative">
                                        <FileText size={20} />
                                        <RefreshCw size={14} className="absolute -bottom-1 -right-1" />
                                    </div>
                                </Button>
                            </div>
                        </div>
                    </div>
                </>

                {/* Document Summary */}
                <DocumentsSummary
                    projectId={activeTemplate.projectId}
                />

                {/* PDF Preveiw Dialog */}
                <PdfPreviewDialog
                    isOpen={isPreveiwTemplte}
                    onClose={() => setIsPreveiwTemplte(false)}
                    pdfUrl={activeTemplate.secureUrl}
                    documentName={activeTemplate.originalFileName}
                />

                <UploadTemplateForm
                    isOpen={isReplaceTemplate}
                    onClose={() => setIsReplaceTemplate(false)}
                    projectId={activeTemplate.projectId} />

                <TemplateSchemaDialog
                    isOpen={isSchemaViewerOpen}
                    onClose={() => setIsSchemaViewerOpen(false)}
                    template={activeTemplate}
                />
            </div>
        </div >
    )
};

export default DocumentSection;