import { cn } from "@/lib/utils";
import React from "react";
import { DataTablePagination } from "./DataTablePagination";

export interface DataTableColumn<T> {
    id: string;
    header: React.ReactNode;
    accessorKey?: keyof T;
    cell?: (row: T) => React.ReactNode;
    className?: string;
    headerClassName?: string;
}

export interface IDataTableProps<T> {
    data: T[];
    columns: DataTableColumn<T>[];
    getRowId?: (row: T, index: number) => string;
    isLoading?: boolean;
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
    // Pagination
    pagination?: {
        page: number;
        pageSize: number;
        total: number;
        onPageChange: (page: number) => void;
        onPageSizeChange?: (pageSize: number) => void;
    };
};

const DataTable = <T,>({
    data,
    columns,
    getRowId,
    isLoading = false,
    emptyMessage = "No data found.",
    onRowClick,
    pagination,
}: IDataTableProps<T>) => {

    return (
        <div className="w-full bg-surface border border-border-subtle rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border-subtle bg-surface-container-lowest">
                            {columns.map((column) => (
                                <th
                                    key={column.id}
                                    className={cn("py-2 px-4",
                                        "font-label-sm text-label-sm text-[11px]",
                                        "text-secondary uppercase font-semibold",
                                        column.headerClassName)}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="font-body-sm text-body-sm text-text-primary divide-y divide-border-subtle">
                        {/* Loading */}
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, index) => (
                                <tr key={index}>
                                    {columns.map((column) => (
                                        <td key={column.id} className={column.className}>
                                            {/* Loader Component */}
                                            <div className="flex items-center gap-2">
                                                <div className="animate-pulse h-4 w-10 rounded bg-surface-container-lowest"></div>
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            /* Empty */
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="p-10 text-center text-secondary"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => (
                                <tr
                                    key={
                                        getRowId
                                            ? getRowId(row, rowIndex)
                                            : rowIndex
                                    }
                                    onClick={() => onRowClick?.(row)}
                                    className={cn(
                                        "hover:bg-surface-container-low transition-colors group",
                                        onRowClick && "cursor-pointer"
                                    )}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.id}
                                            className={cn("p-2", column.className)}
                                        >
                                            {column.cell
                                                ? column.cell(row)
                                                : column.accessorKey
                                                    ? String(row[column.accessorKey] ?? "-")
                                                    : null}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default DataTable;