"use client";

import React, { useState, useEffect } from "react";
import {
    Document,
    useGetAllDocumentsQuery,
    useProcessDocumentMutation,
    useDeleteDocumentMutation,
} from "@/features/documents/documentApi";
import { useGetProjectsQuery } from "@/features/projects/projectApi";
import DataTable, { DataTableColumn } from "@/components/ui/data-table/DataTable";
import { DataTablePagination } from "@/components/ui/data-table/DataTablePagination";
import { cn, formatDate, formatSize, getFileType } from "@/lib/utils";
import {
    Eye,
    FileText,
    FileDown,
    Sparkles,
    FileCheck,
    Trash2,
    Upload,
    Loader2,
    Folder,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import UploadDocumentsForm from "@/features/documents/components/UploadDocumentsForm";
import PdfPreviewDialog from "@/components/documents/PdfPreviewDialog";
import TransformedDocumentPreviewDialog from "@/features/documents/components/TransformedDocumentPreviewDialog";
import DocumentToolbar from "@/features/documents/components/DocumentToolbar";
import DocumentCard from "@/features/documents/components/DocumentCard";
import DocumentsKPIHeader from "@/features/documents/components/DocumentsKPIHeader";
import { Dialog } from "@/components/ui/dialog";
import toast from "react-hot-toast";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export interface IPreviewDocument {
    data: Document | null;
    isOpen: boolean;
}

const DocumentsWorkspace: React.FC = () => {
    const searchParams = useSearchParams();
    const urlStatus = searchParams?.get("status") || "ALL";
    const urlProjectId = searchParams?.get("projectId") || "ALL";
    const urlSearch = searchParams?.get("search") || "";

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchQuery, setSearchQuery] = useState(urlSearch);
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(urlSearch);
    const [statusFilter, setStatusFilter] = useState(urlStatus);
    const [selectedProjectId, setSelectedProjectId] = useState(urlProjectId);
    const [sortBy, setSortBy] = useState<"createdAt" | "name" | "size" | "status">("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    const [isUploadFormOpen, setIsUploadFormOpen] = useState<boolean>(false);
    const [previewDocument, setPreviewDocument] = useState<IPreviewDocument>({ data: null, isOpen: false });
    const [previewTransformedDocument, setPreviewTransformedDocument] = useState<{ id: string | null; isOpen: boolean }>({ id: null, isOpen: false });
    const [deletingDocument, setDeletingDocument] = useState<Document | null>(null);

    // Auto set viewMode to grid on mobile devices
    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth < 640) {
            setViewMode("grid");
        }
    }, []);

    // Sync state if URL search parameters change externally
    useEffect(() => {
        const s = searchParams?.get("status");
        const p = searchParams?.get("projectId");
        if (s && s !== statusFilter) setStatusFilter(s);
        if (p && p !== selectedProjectId) setSelectedProjectId(p);
    }, [searchParams]);

    // Debounce search query by 300ms before querying backend
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchQuery]);

    // Query all organization documents
    const { data: queryData, isLoading, isFetching, isError, error, refetch } = useGetAllDocumentsQuery({
        page,
        limit: pageSize,
        search: debouncedSearchQuery,
        status: statusFilter,
        projectId: selectedProjectId,
        sortBy,
        sortOrder,
    });

    // Query projects list for project filter & upload dropdown
    const { data: projectsData } = useGetProjectsQuery();
    const projectsList = (projectsData?.data?.projects || []).map((p: any) => ({
        id: p.id,
        name: p.name,
    }));

    const [processDocumentMutation, { isLoading: isProcessing }] = useProcessDocumentMutation();
    const [deleteDocumentMutation, { isLoading: isDeleting }] = useDeleteDocumentMutation();

    const documents = queryData?.data?.documents || [];
    const totalDocuments = queryData?.data?.total || 0;
    const totalPages = queryData?.data?.totalPages || Math.ceil(totalDocuments / pageSize);
    const startItem = totalDocuments === 0 ? 0 : (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, totalDocuments);
    const stats = queryData?.data?.stats;

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
        setSelectedProjectId("ALL");
        setSortBy("createdAt");
        setSortOrder("desc");
        setPage(1);
    };

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

    const handleProcessDocument = async (id: string) => {
        try {
            await processDocumentMutation({ documentId: id }).unwrap();
            toast.success("Document processing started");
        } catch (error: any) {
            console.error("Error processing document:", error);
            toast.error(error?.data?.message || "Failed to process document");
        }
    };

    const documentColumns: DataTableColumn<any>[] = [
        {
            id: "document",
            header: "Document",
            cell: (doc: any) => {
                const fileName = doc.originalFileName || doc.originalFilename;
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 max-w-64">
                            <p className="font-semibold text-[13px] text-text-primary truncate" title={fileName}>
                                {fileName}
                            </p>
                            <p className="text-secondary text-[12px] truncate">
                                {getFileType(doc.mimeType, fileName)}
                            </p>
                        </div>
                    </div>
                );
            },
        },
        {
            id: "project",
            header: "Project",
            cell: (doc: any) => {
                const projectName = typeof doc.projectId === "object" ? doc.projectId?.name : null;
                const projectId = typeof doc.projectId === "object" ? doc.projectId?._id : doc.projectId;
                if (!projectName) return <span className="text-slate-400 text-xs">—</span>;

                return (
                    <Link
                        href={`/project/${projectId}`}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-primary font-medium truncate max-w-44 transition-colors"
                        title={projectName}
                    >
                        <Folder className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{projectName}</span>
                    </Link>
                );
            },
        },
        {
            id: "size",
            header: "Size",
            cell: (doc: any) => (
                <span className="text-secondary text-[13px]">
                    {formatSize(doc.sizeBytes)}
                </span>
            ),
        },
        {
            id: "status",
            header: "Status",
            cell: (doc: any) => {
                const statusStyles: Record<string, string> = {
                    UPLOADED: "bg-blue-50 text-blue-700 border-blue-200/80",
                    PROCESSING: "bg-amber-50 text-amber-700 border-amber-200/80",
                    TRANSFORMED: "bg-indigo-50 text-indigo-700 border-indigo-200/80",
                    VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
                    EXPORTED: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
                    REVIEW_REQUIRED: "bg-rose-50 text-rose-700 border-rose-200/80",
                    FAILED: "bg-rose-50 text-rose-700 border-rose-200/80",
                };

                return (
                    <span
                        className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                            statusStyles[doc.status] || "bg-slate-100 text-slate-700 border-slate-200"
                        )}
                    >
                        {doc.status?.replaceAll("_", " ")}
                    </span>
                );
            },
        },
        {
            id: "uploader",
            header: "Uploader",
            cell: (doc: any) => {
                const uploader = typeof doc.uploadedById === "object" ? doc.uploadedById : null;
                if (!uploader) return <span className="text-slate-400 text-xs">—</span>;
                const fullName = `${uploader.firstName || ""} ${uploader.lastName || ""}`.trim() || uploader.email || "User";
                const initials = ((uploader.firstName?.[0] || "") + (uploader.lastName?.[0] || "")).toUpperCase() || "U";

                return (
                    <div className="flex items-center gap-2 max-w-36" title={uploader.email || fullName}>
                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600 flex items-center justify-center shrink-0">
                            {initials}
                        </div>
                        <span className="text-[12px] font-medium text-slate-700 truncate">
                            {fullName}
                        </span>
                    </div>
                );
            },
        },
        {
            id: "createdAt",
            header: "Uploaded",
            cell: (doc: any) => (
                <span className="text-secondary text-[13px]">
                    {formatDate(doc.createdAt)}
                </span>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            headerClassName: "text-right",
            className: "text-right",
            cell: (doc: any) => (
                <div className="flex items-center justify-end gap-1.5 px">
                    <Button
                        variant="outline"
                        onClick={() => setPreviewDocument({ data: doc, isOpen: true })}
                        className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                        size="icon-sm"
                        title="Preview Document"
                    >
                        <Eye className="h-4 w-4 text-primary/70 hover:text-primary" />
                    </Button>

                    {doc.status === "UPLOADED" ? (
                        <Button
                            variant="outline"
                            title="Transform Document"
                            className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                            size="icon-sm"
                            onClick={() => handleProcessDocument(doc._id)}
                        >
                            {isProcessing ? (
                                <Loader2 className="h-4 w-4 text-primary/70 hover:text-primary animate-spin" />
                            ) : (
                                <Sparkles className="h-4 w-4 text-primary/70 hover:text-primary" />
                            )}
                        </Button>
                    ) : ["TRANSFORMED", "VERIFIED", "EXPORTED"].includes(doc.status) ? (
                        <Button
                            variant="outline"
                            title={doc.status === "VERIFIED" ? "Export Document" : "Verify Document"}
                            className="text-secondary hover:text-primary transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                            size="icon-sm"
                            onClick={() => setPreviewTransformedDocument({ id: doc._id, isOpen: true })}
                        >
                            {doc.status === "VERIFIED" || doc.status === "EXPORTED" ? (
                                <FileDown className="h-4 w-4 text-primary/70 hover:text-primary" />
                            ) : (
                                <FileCheck className="h-4 w-4 text-primary/70 hover:text-primary" />
                            )}
                        </Button>
                    ) : null}

                    <Button
                        variant="outline"
                        onClick={() => handleDelete(doc._id)}
                        className="text-error hover:text-error transition-colors flex items-center justify-center p-xs rounded-md hover:bg-surface-container"
                        size="icon-sm"
                        title="Delete Document"
                    >
                        <Trash2 className="h-4 w-4 text-error/70 hover:text-error" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="p-2 xs:px-4 xs:py-4 flex-1 flex flex-col gap-1 sm:gap-2 max-w-360 mx-auto w-full">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="font-headline-md text-2xl font-bold text-slate-900 tracking-tight">
                            Documents Workspace
                        </h1>
                        {totalDocuments > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                                {totalDocuments} {totalDocuments === 1 ? "document" : "documents"}
                            </span>
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Centralized repository for all extracted, transformed, and verified documents across your organization.
                    </p>
                </div>

                <Button
                    onClick={() => setIsUploadFormOpen(true)}
                    className="bg-primary text-white! hover:text-white! font-label-md hover:bg-primary-container transition-colors shrink-0 py-2 px-4 text-label-md cursor-pointer self-start sm:self-auto"
                >
                    <Upload className="w-4 h-4 mr-1.5" /> Add Documents
                </Button>
            </div>

            {/* Top KPI Metric Cards */}
            <DocumentsKPIHeader
                stats={stats}
                activeStatusFilter={statusFilter}
                onSelectStatus={(status) => {
                    setStatusFilter(status);
                    setPage(1);
                }}
            />

            {/* Toolbar: Search, Project Filter, Status Filter, Sort, View Switcher */}
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
                projects={projectsList}
                selectedProjectId={selectedProjectId}
                onProjectChange={(projId) => {
                    setSelectedProjectId(projId);
                    setPage(1);
                }}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={handleSort}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onResetFilters={handleResetFilters}
            />

            {/* Content: Grid or Table View */}
            <div className="mb-4">
                {isError ? (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-8 text-center text-rose-700 shadow-xs">
                        <p className="font-semibold text-sm">Failed to load documents</p>
                        <p className="text-xs text-rose-600 mt-1.5 max-w-[480px] mx-auto leading-relaxed">
                            {(error as any)?.data?.message || "An error occurred while communicating with the document server."}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            className="mt-3 text-rose-700 border-rose-300 hover:bg-rose-100/70 cursor-pointer"
                        >
                            Retry
                        </Button>
                    </div>
                ) : viewMode === "grid" ? (
                    documents.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center text-slate-500 text-sm shadow-xs">
                            {searchQuery || statusFilter !== "ALL" || selectedProjectId !== "ALL"
                                ? "No documents match your filter criteria."
                                : "No documents found in your organization."}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-2">
                            {documents.map((doc: any) => (
                                <DocumentCard
                                    key={doc._id}
                                    document={doc}
                                    projectName={typeof doc.projectId === "object" ? doc.projectId?.name : undefined}
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
                        getRowId={(doc: any) => doc._id}
                        isLoading={isLoading || isFetching}
                        emptyMessage={
                            searchQuery || statusFilter !== "ALL" || selectedProjectId !== "ALL"
                                ? "No documents match your filter criteria."
                                : "No documents found."
                        }
                    />
                )}
            </div>

            {/* Pagination Controls */}
            {totalDocuments > pageSize && (
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

            {/* Universal Upload Modal */}
            <UploadDocumentsForm
                projects={projectsList}
                isOpen={isUploadFormOpen}
                onClose={() => setIsUploadFormOpen(false)}
            />

            {/* PDF & Image Preview Modal */}
            {previewDocument.data && (
                <PdfPreviewDialog
                    isOpen={previewDocument.isOpen}
                    onClose={() => setPreviewDocument({ data: null, isOpen: false })}
                    pdfUrl={previewDocument.data?.secureUrl}
                    documentName={previewDocument.data?.originalFileName || previewDocument.data?.originalFilename}
                />
            )}

            {/* Transformed Document Data Preview Dialog */}
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
                    className="max-w-md"
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
    );
};

export default DocumentsWorkspace;
