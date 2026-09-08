import React, { useState, useEffect, useMemo } from "react";
import { Document, useGetDocumentsQuery, useProcessDocumentMutation, useDeleteDocumentMutation } from "@/features/documents/documentApi";
import DataTable, { DataTableColumn } from "@/components/ui/data-table/DataTable";
import { DataTablePagination } from "@/components/ui/data-table/DataTablePagination";
import { cn, formatDate, formatSize, getFileType } from "@/lib/utils";
import { Eye, FileText, FileDown, Sparkles, FileCheck, Trash2, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import UploadDocumentsForm from "@/features/documents/components/UploadDocumentsForm";
import PdfPreviewDialog from "@/components/documents/PdfPreviewDialog";
import TransformedDocumentPreviewDialog from "@/features/documents/components/TransformedDocumentPreviewDialog";
import DocumentToolbar from "@/features/documents/components/DocumentToolbar";
import DocumentCard from "@/features/documents/components/DocumentCard";
import { Dialog } from "@/components/ui/dialog";
import toast from "react-hot-toast";

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
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [sortBy, setSortBy] = useState<"createdAt" | "name" | "size" | "status">("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    const [previewDocument, setPreviewDocument] = useState<IPreviewDocument>({ data: null, isOpen: false });
    const [previewTransformedDocument, setPreviewTransformedDocument] = useState<{ id: string | null, isOpen: boolean }>({ id: null, isOpen: false });
    const [deletingDocument, setDeletingDocument] = useState<Document | null>(null);

    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

    // Auto set viewMode to grid on mobile devices
    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth < 640) {
            setViewMode("grid");
        }
    }, []);

    // Debounce search input by 300ms before querying backend
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    const { data: queryData, isLoading, isFetching } = useGetDocumentsQuery({
        projectId,
        page,
        limit: pageSize,
        search: debouncedSearchQuery,
        status: statusFilter,
        sortBy,
        sortOrder,
    });

    const [
        processDocumentMutation,
        {
            isLoading: isProcessing,
            isError: isProcessingError,
            error: processingError
        }] = useProcessDocumentMutation();
    const [deleteDocumentMutation, { isLoading: isDeleting }] = useDeleteDocumentMutation();

    const documents = queryData?.data?.documents || [];
    const totalDocuments = queryData?.data?.total || 0;
    const totalPages = queryData?.data?.totalPages || Math.ceil(totalDocuments / pageSize);
    const startItem = totalDocuments === 0 ? 0 : (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, totalDocuments);

    const handleSort = (field: "createdAt" | "name" | "size" | "status") => {
        if (sortBy === field) {
            setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortBy(field);
            setSortOrder("desc");
        }
        setPage(1);
    };

    const handleResetFilters = () => {
        setSearchQuery("");
        setStatusFilter("ALL");
        setSortBy("createdAt");
        setSortOrder("desc");
        setPage(1);
    };

    if (!isLoading && !isFetching && documents.length === 0 && !searchQuery && statusFilter === "ALL" && page === 1) {
        return null;
    }

    const handleDelete = (id: string) => {
        const doc = documents.find((d) => d._id === id);
        if (doc) {
            setDeletingDocument(doc);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deletingDocument) return;
        try {
            await deleteDocumentMutation(deletingDocument._id).unwrap();
            toast.success("Document deleted successfully");
            if (documents.length === 1 && page > 1) {
                setPage((prev) => prev - 1);
            }
            setDeletingDocument(null);
        } catch (error: any) {
            console.error("Error deleting document:", error);
            toast.error(error?.data?.message || "Failed to delete document");
        }
    };

    const handleView = (id: string) => {

    }

    const handleProcessDocument = async (id: string) => {
        try {
            await processDocumentMutation({ documentId: id }).unwrap();
        } catch (error) {
            console.error("Error processing document:", error);
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
                const statusConfig: Record<string, string> = {
                    UPLOADED: "bg-primary/10 text-primary",
                    PROCESSING: "bg-warning-container text-warning",
                    TRANSFORMED: "bg-primary/10 text-primary",
                    VERIFIED: "bg-success-container text-success",
                    EXPORTED: "bg-secondary-container text-secondary",
                    REVIEW_REQUIRED: "bg-error-container text-error",
                    TRUSTED: "bg-tertiary-container text-tertiary",
                    REJECTED: "bg-error-container text-error",
                    FAILED: "bg-error-container text-error",
                };

                return (
                    <span
                        className={cn(
                            "px-2 py-1 rounded-full font-label-sm text-[12px] font-semibold tracking-wide border border-border-subtle",
                            statusConfig[document.status] || "bg-secondary-container text-secondary"
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
                            size={"icon-sm"}
                            onClick={() => handleProcessDocument(document._id)}
                        >
                            {isProcessing ? (
                                <Loader2 className="h-5 w-5 text-primary/70 hover:text-primary animate-spin" />
                            ) : (
                                <Sparkles className="h-5 w-5 text-primary/70 hover:text-primary" />
                            )}
                        </Button>
                    ) : ["TRANSFORMED", "VERIFIED", "EXPORTED"].includes(document.status) ? (
                        <Button
                            variant="outline"
                            title={document.status === "VERIFIED" ? "Export Document" : "Verify Document"}
                            className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                            size={"icon-sm"}
                            onClick={() => setPreviewTransformedDocument({ id: document._id, isOpen: true })}>
                            {document.status === "VERIFIED" || document.status === "EXPORTED" ? (
                                <FileDown className="h-5 w-5 text-primary/70 hover:text-primary" />
                            ) : (
                                <FileCheck className="h-5 w-5 text-primary/70 hover:text-primary" />
                            )}
                        </Button>
                    ) : null}

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
        <div className="w-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-headline-md text-headline-md text-text-primary">Documents Workspace</h3>
                <Button onClick={() => setIsUploadFormOpen(true)} className="bg-primary text-white! hover:text-white! font-label-md hover:bg-primary-container transition-colors shrink-0 py-2 px-4 text-label-md cursor-pointer">
                    <Upload className="w-4 h-4 mr-1.5" /> Add Documents
                </Button>
            </div>

            {/* Toolbar: Search, Filters, View Switcher */}
            <DocumentToolbar
                searchQuery={searchQuery}
                onSearchChange={(query) => {
                    setSearchQuery(query);
                    setPage(1);
                }}
                statusFilter={statusFilter}
                onStatusFilterChange={(status) => {
                    setStatusFilter(status);
                    setPage(1);
                }}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSort}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onResetFilters={handleResetFilters}
            />

            {/* Document Content: Grid or Table View */}
            <div className="mb-4">
                {viewMode === "grid" ? (
                    documents.length === 0 ? (
                        <div className="bg-surface rounded-xl border border-border-subtle p-12 text-center text-secondary text-sm">
                            {searchQuery || statusFilter !== "ALL"
                                ? "No documents match your filter criteria."
                                : "No documents found."}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {documents.map((doc) => (
                                <DocumentCard
                                    key={doc._id}
                                    document={doc}
                                    isProcessing={isProcessing}
                                    onView={(d) => setPreviewDocument({ data: d, isOpen: true })}
                                    onProcess={handleProcessDocument}
                                    onVerifyOrExport={(id) => setPreviewTransformedDocument({ id, isOpen: true })}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )
                ) : (
                    <DataTable
                        data={documents}
                        columns={documentColumns}
                        getRowId={(document: Document) => document._id}
                        isLoading={isLoading || isFetching}
                        emptyMessage={
                            searchQuery || statusFilter !== "ALL"
                                ? "No documents match your filter criteria."
                                : "No documents found."
                        }
                    />
                )}
            </div>

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

            {/* Transformed Document Preview Dialog */}
            {previewTransformedDocument.id && previewTransformedDocument.isOpen && (
                <TransformedDocumentPreviewDialog
                    documentId={previewTransformedDocument.id}
                    isOpen={previewTransformedDocument.isOpen}
                    onClose={() => setPreviewTransformedDocument({ id: null, isOpen: false })}
                />
            )}

            {/* Delete Confirmation Dialog */}
            {deletingDocument && (
                <Dialog
                    className="max-w-75"
                    open={!!deletingDocument}
                    onClose={() => !isDeleting && setDeletingDocument(null)}
                    title="Delete Document"
                    footer={
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={() => setDeletingDocument(null)}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                                className="bg-error text-white hover:bg-error/90 flex items-center gap-1.5"
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </>
                                )}
                            </Button>
                        </div>
                    }
                >
                    <div className="p-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-error-container text-error rounded-lg shrink-0">
                                <Trash2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-semibold text-text-primary text-sm">
                                    Are you sure you want to delete this document?
                                </p>
                                <p className="text-secondary text-xs mt-1">
                                    <span className="font-medium text-text-primary">
                                        {deletingDocument.originalFileName || deletingDocument.originalFilename}
                                    </span>{" "}
                                    will be permanently deleted. This action cannot be undone.
                                </p>
                            </div>
                        </div>
                    </div>
                </Dialog>
            )}
        </div>
    )
}

export default DocumentView