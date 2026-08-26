import React, { useState } from "react";
import { Document, useGetDocumentsQuery } from "@/features/documents/documentApi";
import DataTable, { DataTableColumn } from "@/components/ui/data-table/DataTable";
import { DataTablePagination } from "@/components/ui/data-table/DataTablePagination";
import { cn, formatDate, formatSize, getFileType } from "@/lib/utils";
import { Eye, FileText, FileDown, Sparkles, FileCheck, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import UploadDocumentsForm from "@/features/documents/components/UploadDocumentsForm";
import PdfPreviewDialog from "@/components/documents/PdfPreviewDialog";

export interface IDocumentViewProps {
    projectId: string;
}

export interface IPreviewDocument {
    data: Document | null;
    isOpen: boolean;
}

const DocumentView: React.FC<IDocumentViewProps> = ({ projectId }) => {
    const [isUploadFormOpen, setIsUploadFormOpen] = useState<boolean>(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [previewDocument, setPreviewDocument] = useState<IPreviewDocument>({ data: null, isOpen: false });

    const { data: queryData, isLoading } = useGetDocumentsQuery({ projectId, page, limit: pageSize });

    const documents = queryData?.data?.documents || [];
    const totalDocuments = queryData?.data?.total || 0;

    const totalPages = Math.ceil(totalDocuments / pageSize);
    const startItem = (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, totalDocuments);

    if (!isLoading && documents.length === 0) {
        return null;
    }

    const handleDelete = (id: string) => {

    }

    const handleView = (id: string) => {

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

                    {document.status === 'UPLOADED' ? (
                        <Button
                            variant="outline"
                            title="Transform Document"
                            className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                            size={"icon-sm"}>
                            <Sparkles className="h-5 w-5 text-primary/70 hover:text-primary" />
                        </Button>
                    ) : document.status === 'REVIEW_REQUIRED' ? (
                        <Button
                            variant="outline"
                            title="Verify Document"
                            className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                            size={"icon-sm"}>
                            <FileCheck className="h-5 w-5 text-primary/70 hover:text-primary" />
                        </Button>
                    ) : document.status === "TRUSTED" && (
                        <Button
                            variant="outline"
                            title="Export Document"
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