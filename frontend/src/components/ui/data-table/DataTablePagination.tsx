import React from "react";

interface DataTablePaginationProps {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    startItem: number;
    endItem: number;

    onPageChange: (page: number) => void;

    onPageSizeChange?: (pageSize: number) => void;
}

export const DataTablePagination: React.FC<DataTablePaginationProps> = ({
    page,
    pageSize,
    total,
    totalPages,
    startItem,
    endItem,
    onPageChange,
    onPageSizeChange,
}) => {
    const getPages = () => {
        const pages: (number | "...")[] = [];

        if (totalPages <= 5) {
            return Array.from(
                { length: totalPages },
                (_, index) => index + 1
            );
        }

        pages.push(1);

        if (page > 3) {
            pages.push("...");
        }

        const start = Math.max(2, page - 1);
        const end = Math.min(totalPages - 1, page + 1);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (page < totalPages - 2) {
            pages.push("...");
        }

        pages.push(totalPages);

        return pages;
    };

    return (
        <div className="mt-4 flex flex-row items-center justify-between gap-2 px-1 sm:px-2 text-xs sm:text-sm text-secondary">
            {/* Result count */}
            <p className="text-xs sm:text-sm text-secondary shrink-0">
                Showing{" "}
                <span className="font-semibold text-text-primary">
                    {startItem}-{endItem}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-text-primary">
                    {total}
                </span>
            </p>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Page size */}
                {onPageSizeChange && (
                    <select
                        value={pageSize}
                        onChange={(event) =>
                            onPageSizeChange(Number(event.target.value))
                        }
                        className="rounded-md border border-border-subtle bg-surface px-2 py-1 sm:py-1.5 text-xs sm:text-sm outline-none cursor-pointer"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                )}

                {/* Previous */}
                <button
                    type="button"
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                    className="rounded-md border border-border-subtle px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                    Prev
                </button>

                {/* Pages */}
                <div className="hidden items-center gap-1 sm:flex">
                    {getPages().map((item, index) =>
                        item === "..." ? (
                            <span
                                key={`ellipsis-${index}`}
                                className="px-2"
                            >
                                ...
                            </span>
                        ) : (
                            <button
                                key={item}
                                type="button"
                                onClick={() => onPageChange(item)}
                                className={[
                                    "min-w-8 rounded-md px-2 py-1.5 text-xs sm:text-sm",
                                    "transition-colors",
                                    item === page
                                        ? "bg-primary text-on-primary"
                                        : "border border-border-subtle hover:bg-surface-container-low",
                                ].join(" ")}
                            >
                                {item}
                            </button>
                        )
                    )}
                </div>

                {/* Next */}
                <button
                    type="button"
                    disabled={page === totalPages}
                    onClick={() => onPageChange(page + 1)}
                    className="rounded-md border border-border-subtle px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                >
                    Next
                </button>
            </div>
        </div>
    );
}