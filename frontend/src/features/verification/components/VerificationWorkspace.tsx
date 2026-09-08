"use client";

import React, { useState, useEffect } from "react";
import {
    Document,
    useGetAllDocumentsQuery,
    useVerifyDocumentMutation,
    useBulkVerifyDocumentsMutation,
    useRejectDocumentMutation,
} from "@/features/documents/documentApi";
import { useGetProjectsQuery } from "@/features/projects/projectApi";
import { DataTablePagination } from "@/components/ui/data-table/DataTablePagination";
import VerificationKPIHeader from "./VerificationKPIHeader";
import VerificationToolbar from "./VerificationToolbar";
import VerificationQueueTable from "./VerificationQueueTable";
import VerificationCard from "./VerificationCard";
import VerificationGridSelectionBar from "./VerificationGridSelectionBar";
import VerificationWorkbenchModal from "./VerificationWorkbenchModal";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldCheck, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

const VerificationWorkspace: React.FC = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
    const [selectedProjectId, setSelectedProjectId] = useState("ALL");
    const [stageFilter, setStageFilter] = useState("NEEDS_VERIFICATION");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc"); // Default FIFO (Oldest first)
    const [viewMode, setViewMode] = useState<"table" | "grid">("table");

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [processingDocId, setProcessingDocId] = useState<string | null>(null);

    // Auto set viewMode to grid on mobile devices
    useEffect(() => {
        if (typeof window !== "undefined" && window.innerWidth < 640) {
            setViewMode("grid");
        }
    }, []);

    // Workbench modal state
    const [workbenchState, setWorkbenchState] = useState<{
        isOpen: boolean;
        currentIndex: number;
        document: Document | null;
    }>({
        isOpen: false,
        currentIndex: 0,
        document: null,
    });

    // Table rejection dialog
    const [rejectingDoc, setRejectingDoc] = useState<Document | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Query documents
    const { data: queryData, isLoading, isFetching, refetch } = useGetAllDocumentsQuery({
        page,
        limit: pageSize,
        search: debouncedSearchQuery,
        status: stageFilter,
        projectId: selectedProjectId,
        sortBy: "createdAt",
        sortOrder,
    });

    // Query projects list for project dropdown
    const { data: projectsData } = useGetProjectsQuery();
    const projectsList = (projectsData?.data?.projects || []).map((p: any) => ({
        id: p.id,
        name: p.name,
    }));

    const [verifyDocumentMutation, { isLoading: isSingleVerifying }] = useVerifyDocumentMutation();
    const [bulkVerifyMutation, { isLoading: isBulkVerifying }] = useBulkVerifyDocumentsMutation();
    const [rejectDocumentMutation, { isLoading: isRejectingMutation }] = useRejectDocumentMutation();

    const documents = queryData?.data?.documents || [];
    const totalDocuments = queryData?.data?.total || 0;
    const totalPages = queryData?.data?.totalPages || Math.ceil(totalDocuments / pageSize);
    const startItem = totalDocuments === 0 ? 0 : (page - 1) * pageSize + 1;
    const endItem = Math.min(page * pageSize, totalDocuments);
    const stats = queryData?.data?.stats;

    // Selection handlers
    const handleToggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const isAllSelected = documents.length > 0 && documents.every((d) => selectedIds.has(d._id));
    const isSomeSelected = documents.some((d) => selectedIds.has(d._id)) && !isAllSelected;

    const handleToggleSelectAll = () => {
        if (documents.every((d) => selectedIds.has(d._id))) {
            setSelectedIds(new Set());
        } else {
            const next = new Set(selectedIds);
            documents.forEach((d) => next.add(d._id));
            setSelectedIds(next);
        }
    };

    const handleResetFilters = () => {
        setSearchQuery("");
        setSelectedProjectId("ALL");
        setStageFilter("NEEDS_VERIFICATION");
        setSortOrder("asc");
        setPage(1);
    };

    // Quick Approve 1-click handler
    const handleQuickApprove = async (documentId: string) => {
        setProcessingDocId(documentId);
        try {
            await verifyDocumentMutation({ documentId, status: "VERIFIED" }).unwrap();
            toast.success("Document verified & signed off");
            setSelectedIds((prev) => {
                const next = new Set(prev);
                next.delete(documentId);
                return next;
            });
        } catch (err: any) {
            console.error("Quick approve error:", err);
            toast.error(err?.data?.message || "Failed to verify document");
        } finally {
            setProcessingDocId(null);
        }
    };

    // Bulk Approve handler
    const handleBulkApprove = async () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;

        try {
            toast.loading(`Verifying ${ids.length} documents...`, { id: "bulk-verify" });
            const res = await bulkVerifyMutation({ documentIds: ids }).unwrap();
            const { successful, failed } = res.data;

            if (failed.length === 0) {
                toast.success(`All ${successful.length} documents verified successfully!`, { id: "bulk-verify" });
            } else {
                toast.success(`${successful.length} verified, ${failed.length} failed`, { id: "bulk-verify" });
            }
            setSelectedIds(new Set());
        } catch (err: any) {
            console.error("Bulk verify error:", err);
            toast.error(err?.data?.message || "Bulk verification failed", { id: "bulk-verify" });
        }
    };

    // Rejection handlers
    const handleOpenRejectDialog = (doc: Document) => {
        setRejectingDoc(doc);
        setRejectionReason("");
    };

    const handleConfirmTableReject = async () => {
        if (!rejectingDoc) return;
        try {
            await rejectDocumentMutation({
                documentId: rejectingDoc._id,
                reason: rejectionReason,
            }).unwrap();
            toast.success("Document flagged as rejected");
            setRejectingDoc(null);
            setRejectionReason("");
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to reject document");
        }
    };

    // Workbench Launch and Navigation
    const handleOpenWorkbench = (doc: Document, index: number) => {
        setWorkbenchState({
            isOpen: true,
            currentIndex: index,
            document: doc,
        });
    };

    const handleWorkbenchPrevious = () => {
        if (workbenchState.currentIndex > 0) {
            const nextIdx = workbenchState.currentIndex - 1;
            setWorkbenchState({
                isOpen: true,
                currentIndex: nextIdx,
                document: documents[nextIdx],
            });
        }
    };

    const handleWorkbenchNext = () => {
        if (workbenchState.currentIndex < documents.length - 1) {
            const nextIdx = workbenchState.currentIndex + 1;
            setWorkbenchState({
                isOpen: true,
                currentIndex: nextIdx,
                document: documents[nextIdx],
            });
        }
    };

    // Workbench Approve & Next Progression Flow
    const handleWorkbenchApprove = async (documentId: string) => {
        try {
            await verifyDocumentMutation({ documentId, status: "VERIFIED" }).unwrap();
            toast.success("Document approved & signed off");

            // Advance to next document if available
            if (workbenchState.currentIndex < documents.length - 1) {
                const nextIdx = workbenchState.currentIndex + 1;
                setWorkbenchState({
                    isOpen: true,
                    currentIndex: nextIdx,
                    document: documents[nextIdx],
                });
            } else {
                toast.success("All items in current page reviewed!");
                setWorkbenchState({ isOpen: false, currentIndex: 0, document: null });
            }
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to verify document");
        }
    };

    const handleWorkbenchReject = async (documentId: string, reason?: string) => {
        try {
            await rejectDocumentMutation({ documentId, reason }).unwrap();
            toast.success("Document rejected");

            if (workbenchState.currentIndex < documents.length - 1) {
                const nextIdx = workbenchState.currentIndex + 1;
                setWorkbenchState({
                    isOpen: true,
                    currentIndex: nextIdx,
                    document: documents[nextIdx],
                });
            } else {
                setWorkbenchState({ isOpen: false, currentIndex: 0, document: null });
            }
        } catch (err: any) {
            toast.error(err?.data?.message || "Failed to reject document");
        }
    };

    const pendingCount = stats?.needsVerification ?? 0;

    return (
        <div className="p-2 xs:px-4 xs:py-4 flex-1 flex flex-col gap-2 sm:gap-3 max-w-360 mx-auto w-full">
            {/* Header Layer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="font-headline-md text-2xl font-bold text-slate-900 tracking-tight">
                            Verification Queue
                        </h1>
                        {pendingCount > 0 ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                {pendingCount} Pending Review
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Queue Clear
                            </span>
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        Human-in-the-loop auditing and schema validation workbench before final export.
                    </p>
                </div>
            </div>

            {/* KPI Metric Cards */}
            <VerificationKPIHeader
                stats={stats}
                activeFilter={stageFilter}
                onSelectFilter={(filter) => {
                    setStageFilter(filter);
                    setPage(1);
                }}
            />

            {/* Unified Toolbar */}
            <VerificationToolbar
                searchQuery={searchQuery}
                onSearchChange={(q) => {
                    setSearchQuery(q);
                    setPage(1);
                }}
                selectedProjectId={selectedProjectId}
                onProjectChange={(pid) => {
                    setSelectedProjectId(pid);
                    setPage(1);
                }}
                projects={projectsList}
                stageFilter={stageFilter}
                onStageFilterChange={(st) => {
                    setStageFilter(st);
                    setPage(1);
                }}
                sortOrder={sortOrder}
                onToggleSortOrder={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                selectedCount={selectedIds.size}
                onBulkApprove={handleBulkApprove}
                isBulkVerifying={isBulkVerifying}
                onResetFilters={handleResetFilters}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            {/* Queue Content: Grid or Table View */}
            <div className="mb-2">
                {documents.length === 0 && !isLoading && !isFetching ? (
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
                        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-slate-900 text-base">Verification Queue Clear</h3>
                        <p className="text-xs text-slate-500 max-w-[480px] mx-auto mt-1.5 leading-relaxed">
                            {searchQuery || selectedProjectId !== "ALL" || stageFilter !== "NEEDS_VERIFICATION"
                                ? "No documents match your current queue filters."
                                : "There are currently no documents waiting for human verification. Great job!"}
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            className="mt-4 text-xs text-slate-600 gap-1.5"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Check for New Documents
                        </Button>
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="space-y-2.5">
                        <VerificationGridSelectionBar
                            totalDocuments={documents.length}
                            selectedCount={selectedIds.size}
                            isAllSelected={isAllSelected}
                            isSomeSelected={isSomeSelected}
                            onToggleSelectAll={handleToggleSelectAll}
                            onClearSelection={() => setSelectedIds(new Set())}
                            onBulkApprove={handleBulkApprove}
                            isBulkVerifying={isBulkVerifying}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                            {documents.map((doc, index) => (
                                <VerificationCard
                                    key={doc._id}
                                    document={doc}
                                    isSelected={selectedIds.has(doc._id)}
                                    onToggleSelect={handleToggleSelect}
                                    onReview={(d) => handleOpenWorkbench(d, index)}
                                    onQuickApprove={handleQuickApprove}
                                    onReject={handleOpenRejectDialog}
                                    isProcessing={processingDocId === doc._id}
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        <VerificationGridSelectionBar
                            totalDocuments={documents.length}
                            selectedCount={selectedIds.size}
                            isAllSelected={isAllSelected}
                            isSomeSelected={isSomeSelected}
                            onToggleSelectAll={handleToggleSelectAll}
                            onClearSelection={() => setSelectedIds(new Set())}
                            onBulkApprove={handleBulkApprove}
                            isBulkVerifying={isBulkVerifying}
                            showWhenZero={false}
                        />

                        <VerificationQueueTable
                            documents={documents}
                            isLoading={isLoading || isFetching}
                            selectedIds={selectedIds}
                            onToggleSelect={handleToggleSelect}
                            onToggleSelectAll={handleToggleSelectAll}
                            onReviewDocument={handleOpenWorkbench}
                            onQuickApprove={handleQuickApprove}
                            onRejectDocument={handleOpenRejectDialog}
                            processingDocId={processingDocId}
                        />
                    </div>
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

            {/* Side-by-Side Verification Workbench Modal */}
            <VerificationWorkbenchModal
                isOpen={workbenchState.isOpen}
                onClose={() => setWorkbenchState({ isOpen: false, currentIndex: 0, document: null })}
                document={workbenchState.document}
                currentIndex={workbenchState.currentIndex}
                totalInQueue={documents.length}
                onPrevious={handleWorkbenchPrevious}
                onNext={handleWorkbenchNext}
                onApprove={handleWorkbenchApprove}
                onReject={handleWorkbenchReject}
                isApproving={isSingleVerifying}
                isRejecting={isRejectingMutation}
            />

            {/* Rejection Modal from Table Action */}
            {rejectingDoc && (
                <Dialog
                    open={!!rejectingDoc}
                    onClose={() => setRejectingDoc(null)}
                    title="Reject Document"
                    className="max-w-md"
                    footer={
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setRejectingDoc(null)}
                                disabled={isRejectingMutation}
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleConfirmTableReject}
                                disabled={isRejectingMutation}
                                className="bg-rose-600 hover:bg-rose-700 text-white"
                            >
                                {isRejectingMutation ? "Rejecting..." : "Confirm Rejection"}
                            </Button>
                        </div>
                    }
                >
                    <div className="p-4 space-y-3">
                        <p className="text-xs text-slate-600">
                            Flag{" "}
                            <span className="font-semibold text-slate-900">
                                {rejectingDoc.originalFileName || rejectingDoc.originalFilename}
                            </span>{" "}
                            as rejected? You can provide a reason for the audit trail:
                        </p>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Reason for rejection (e.g. invalid document, low quality, corrupted data)..."
                            rows={3}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                        />
                    </div>
                </Dialog>
            )}
        </div>
    );
};

export default VerificationWorkspace;
