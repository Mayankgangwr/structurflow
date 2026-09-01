import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Document, useGetDocumentsQuery, useRetryDocumentMutation } from "@/features/documents/documentApi";
import { useGetProjectByIdQuery } from "@/features/projects/projectApi";
import { Template } from "@/features/templates/templateApi";
import DataTable, { DataTableColumn } from "@/components/ui/data-table/DataTable";
import { DataTablePagination } from "@/components/ui/data-table/DataTablePagination";
import { cn, formatDate, formatSize, getFileType } from "@/lib/utils";
import { Eye, FileText, FileDown, Sparkles, FileCheck, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import UploadDocumentsForm from "@/features/documents/components/UploadDocumentsForm";
import PdfPreviewDialog from "@/components/documents/PdfPreviewDialog";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface IDocumentViewProps {
    projectId: string;
}

export interface IPreviewDocument {
    data: Document | null;
    isOpen: boolean;
}

const DocumentView: React.FC<IDocumentViewProps> = ({ projectId }) => {
    const router = useRouter();
    const [isUploadFormOpen, setIsUploadFormOpen] = useState<boolean>(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [previewDocument, setPreviewDocument] = useState<IPreviewDocument>({ data: null, isOpen: false });

    const [retryDocument] = useRetryDocumentMutation();

    // First, let's get the data without polling to check if we need to poll
    const { data: queryData, isLoading } = useGetDocumentsQuery(
        { projectId, page, limit: pageSize }
    );
    const { data: projectQueryData } = useGetProjectByIdQuery(projectId);
    const templateData: Template | undefined = projectQueryData?.data?.templateData;

    const documents = queryData?.data?.documents || [];
    const totalDocuments = queryData?.data?.total || 0;

    // Determine if any document is currently in the pipeline
    const isProcessing = documents.some((doc: Document) =>
        ['UPLOADED', 'PROCESSING', 'EXTRACTED', 'MAPPING', 'VALIDATING'].includes(doc.status)
    );

    // If there are processing documents, set up a polling interval
    useGetDocumentsQuery(
        { projectId, page, limit: pageSize },
        {
            skip: !isProcessing,
            pollingInterval: 3000
        }
    );

    const totalPages = Math.ceil(totalDocuments / pageSize);
    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, totalDocuments);

    if (!isLoading && documents.length === 0) {
        return null;
    }

    const handleDelete = (id: string) => {

    }

    const handleExport = async (doc: Document) => {
        if (!doc.verifiedData && !doc.structuredData) {
            import('react-hot-toast').then(({ default: toast }) => toast.error('No verified data to export'));
            return;
        }

        try {
            const toast = (await import('react-hot-toast')).default;
            toast.loading('Generating high-fidelity PDF...', { id: 'exporting' });
            
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

            const response = await fetch(`${baseUrl}/api/v1/documents/${doc._id}/export`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to export document');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = window.document.createElement('a');
            a.href = url;
            a.download = `${doc.originalFileName?.split('.')[0] || 'document'}_extracted.pdf`;
            window.document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            window.document.body.removeChild(a);

            toast.success('Document exported successfully', { id: 'exporting' });
        } catch (error) {
            console.error('Export error:', error);
            import('react-hot-toast').then(({ default: toast }) => toast.error('Failed to export document', { id: 'exporting' }));
        }
    };

    const handleRetry = async (id: string) => {
        try {
            await retryDocument(id).unwrap();
        } catch (error) {
            console.error("Failed to retry document:", error);
        }
    }

    const documentColumns: DataTableColumn<Document>[] = [
        {
            id: "document",
            header: "Document",
            cell: (document: Document) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <FileText className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 max-w-72">
                        <p className="font-semibold text-[13px] text-text-primary truncate">
                            {document.originalFileName}
                        </p>

                        <p className="text-secondary text-[12px] truncate">
                            {getFileType(document.mimeType, document?.originalFileName || document.originalFilename)}
                        </p>
                    </div>
                </div>
            ),
        },

        {
            id: "size",
            header: "Size",
            cell: (document) => (
                <span className="text-secondary text-[13px]">
                    {formatSize(document.sizeBytes)}
                </span>
            ),
        },

        {
            id: "status",
            header: "Status",
            cell: (document) => {
                const statusConfig: any = {
                    UPLOADED: "bg-primary/10 text-primary",
                    PROCESSING: "bg-warning-container text-warning",
                    REVIEW_REQUIRED: "bg-error-container text-error",
                    TRUSTED: "bg-tertiary-container text-tertiary",
                    REJECTED: "bg-error-container text-error",
                    FAILED: "bg-error-container text-error",
                };

                return (
                    <span
                        className={cn(
                            "px-2 py-1 rounded-full font-label-sm text-[12px] font-semibold tracking-wide border border-border-subtle",
                            statusConfig[document.status]
                        )}
                    >
                        {document.status.replaceAll("_", " ")}
                    </span>
                );
            },
        },

        {
            id: "createdAt",
            header: "Uploaded",
            cell: (document) => (
                <span className="text-secondary text-[13px]">
                    {formatDate(document.createdAt)}
                </span>
            ),
        },

        {
            id: "actions",
            header: "Actions",
            headerClassName: "text-right",
            className: "text-right",
            cell: (document) => (
                <div className="flex items-center justify-end gap-2 px">
                    <Button
                        variant="outline"
                        onClick={() => setPreviewDocument({ data: document, isOpen: true })}
                        className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                        size={"icon-sm"}>
                        <Eye className="h-5 w-5 text-primary/70 hover:text-primary" />
                    </Button>

                    {document.status === 'UPLOADED' || document.status === 'FAILED' ? (
                        <Button
                            variant="outline"
                            title={document.status === 'FAILED' ? 'Retry Transform' : 'Transform Document'}
                            onClick={() => handleRetry(document._id)}
                            className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                            size={"icon-sm"}>
                            <Sparkles className="h-5 w-5 text-primary/70 hover:text-primary" />
                        </Button>
                    ) : document.status === 'REVIEW_REQUIRED' ? (
                        <Button
                            variant="outline"
                            title="Verify Document"
                            onClick={() => router.push(`/project/${projectId}/documents/${document._id}/review`)}
                            className="text-error hover:text-error transition-colors flex items-center justify-center p-xs rounded-md hover:bg-error-container/20 border-error/30"
                            size={"icon-sm"}>
                            <FileCheck className="h-5 w-5 text-error/70 hover:text-error" />
                        </Button>
                    ) : document.status === "TRUSTED" && (
                        <Button
                            variant="outline"
                            title="Export Document"
                            onClick={() => handleExport(document)}
                            className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                            size={"icon-sm"}>
                            <FileDown className="h-5 w-5 text-primary/70 hover:text-primary" />
                        </Button>
                    )}

                    <Button
                        variant="outline"
                        onClick={() => handleDelete(document._id)}
                        className="text-error hover:text-error  transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                        size={"icon-sm"}>
                        <Trash2 className="h-5 w-5 text-error/70 hover:text-error" />
                    </Button>
                </div >
            ),
        },
    ];


    return (
        <div className="">
            <div className="flex items-center justify-between mb-md">
                <h3 className="font-headline-md text-headline-md text-text-primary">Documents Workspace</h3>
                <Button onClick={() => setIsUploadFormOpen(true)} className={`bg-primary text-white! hover:text-white! font-label-md hover:bg-primary-container transition-colors shrink-0 py-2 px-4 text-label-md`}>
                    <Upload className="w-4 h-4" /> Add Documents
                </Button>
            </div>
            <DataTable
                data={documents}
                columns={documentColumns}
                getRowId={(document: Document) => document._id}
                isLoading={isLoading}
                emptyMessage="No documents found."
            />

            {totalDocuments >= pageSize && (
                <DataTablePagination
                    page={page}
                    pageSize={pageSize}
                    total={totalDocuments}
                    totalPages={totalPages}
                    startItem={startItem}
                    endItem={endItem}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size);
                        setPage(1);
                    }}
                />
            )}

            {/* Upload Documents Form */}
            <UploadDocumentsForm
                projectId={projectId}
                isOpen={isUploadFormOpen}
                onClose={() => setIsUploadFormOpen(false)}
            />

            {/* PDF Preveiw Dialog */}
            {previewDocument.data && (
                <PdfPreviewDialog
                    isOpen={previewDocument.isOpen}
                    onClose={() => setPreviewDocument({ data: null, isOpen: false })}
                    pdfUrl={previewDocument.data?.secureUrl}
                    documentName={previewDocument.data?.originalFileName || previewDocument.data?.originalFilename}
                />
            )}
        </div>
    )
}

export default DocumentView