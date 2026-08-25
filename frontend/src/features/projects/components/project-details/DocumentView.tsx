import React from "react";
import { Document } from "@/features/documents/documentApi";
import DataTable, { DataTableColumn } from "@/components/ui/data-table/DataTable";
import { DataTablePagination } from "@/components/ui/data-table/DataTablePagination";
import { cn, formatDate, formatSize, getFileType } from "@/lib/utils";
import { FileText } from "lucide-react";

export interface IDocumentViewProps {
    documents: Document[];
}

const DocumentView: React.FC<IDocumentViewProps> = ({ documents }) => {
    if (documents.length === 0) {
        return null;
    }

    const documentColumns: DataTableColumn<Document>[] = [
        {
            id: "document",
            header: "Document",
            cell: (document: Document) => (
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <FileText className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 max-w-72">
                        <p className="font-semibold text-[12px] text-text-primary truncate">
                            {document.originalFileName}
                        </p>

                        <p className="text-secondary text-[11px] truncate">
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
                <span className="text-secondary text-[12px]">
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
                            "px-2 py-1 rounded-full font-label-sm text-[11px] font-semibold tracking-wide border border-border-subtle",
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
                <span className="text-secondary text-[12px]">
                    {formatDate(document.createdAt)}
                </span>
            ),
        },
        // {
        //     id: "actions",
        //     header: "Actions",
        //     headerClassName: "text-right",
        //     className: "text-right",
        //     cell: (document) => (
        //         <DropdownMenu>
        //             <DropdownMenuTrigger
        //                 onClick={(e) => e.stopPropagation()}
        //                 className="p-1.5 text-secondary transition-colors hover:text-text-primary hover:bg-surface-container-low rounded-md sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 outline-none"
        //             >
        //                 <MoreVertical className="w-5 h-5" />
        //             </DropdownMenuTrigger>

        //             <DropdownMenuContent
        //                 align="end"
        //                 className="w-40 font-body-sm text-body-sm bg-surface border-border-subtle z-50"
        //             >
        //                 <DropdownMenuItem
        //                     className="cursor-pointer hover:bg-surface-container-low text-text-primary"
        //                     onClick={(e) => {
        //                         e.stopPropagation();
        //                         handleView(document);
        //                     }}
        //                 >
        //                     <Eye className="mr-2 h-4 w-4" />
        //                     <span>View</span>
        //                 </DropdownMenuItem>

        //                 <DropdownMenuItem
        //                     className="cursor-pointer hover:bg-surface-container-low text-text-primary"
        //                     onClick={(e) => {
        //                         e.stopPropagation();
        //                         handleReplace(document);
        //                     }}
        //                 >
        //                     <FileSync className="mr-2 h-4 w-4" />
        //                     <span>Replace</span>
        //                 </DropdownMenuItem>

        //                 <DropdownMenuItem
        //                     className="cursor-pointer text-error hover:bg-error/10 hover:text-error focus:bg-error/10 focus:text-error"
        //                     onClick={(e) => {
        //                         e.stopPropagation();
        //                         handleDelete(document._id);
        //                     }}
        //                 >
        //                     <Trash2 className="mr-2 h-4 w-4" />
        //                     <span>Delete</span>
        //                 </DropdownMenuItem>
        //             </DropdownMenuContent>
        //         </DropdownMenu>
        //     ),
        // },
    ];

    return (
        <div className="">
            <DataTable
                data={documents}
                columns={documentColumns}
                getRowId={(document: Document) => document._id}
                isLoading={false}
                emptyMessage="No projects found."
            />
            {/* <DataTablePagination
                page={page}
                pageSize={pageSize}
                total={totalProjects}
                totalPages={totalPages}
                startItem={startItem}
                endItem={endItem}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
            /> */}
        </div>
    )
}

export default DocumentView