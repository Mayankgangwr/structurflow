import React, { useEffect, useState, useMemo } from 'react';
import { Loader2, FileWarning } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PdfViewerProps {
    /**
     * PDF source:
     * - Remote or local URL: "https://.../doc.pdf" or "/api/..."
     * - Base64 Data URI: "data:application/pdf;base64,JVBERi0x..."
     * - Raw base64 string: "JVBERi0x..."
     * - Blob or File object
     */
    src: string | Blob | File | null | undefined;
    /** Accessible title for the PDF frame */
    title?: string;
    /** Outer container CSS class */
    className?: string;
    /** Inner viewer frame CSS class */
    contentClassName?: string;
    /** Whether to show native browser PDF toolbar. Default: false (completely hides toolbar) */
    showToolbar?: boolean;
    /** Fit mode for the initial view: "Fit" | "FitH" | "FitV". Default: "Fit" */
    fitMode?: 'Fit' | 'FitH' | 'FitV';
    /** Custom empty state message or node */
    emptyState?: React.ReactNode;
    /** Callback when iframe finishes loading */
    onLoad?: () => void;
    /** Callback if an error occurs */
    onError?: (err: Error) => void;
}

/**
 * Converts a base64 string (with or without data URI prefix) into a native Blob URL.
 * Fragment parameters like #toolbar=0 only function correctly on Blob/HTTP URLs,
 * and fail when appended directly to raw data: URIs.
 */
function base64ToBlobUrl(base64Str: string): string {
    const pureBase64 = base64Str.replace(/^data:application\/pdf;base64,/, '').trim();
    const binaryStr = atob(pureBase64);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: 'application/pdf' });
    return URL.createObjectURL(blob);
}

/**
 * Generic, high-performance PDF Viewer Component.
 * Displays PDFs flush edge-to-edge without browser toolbars, sidebars, or viewer chrome.
 */
export const PdfViewer: React.FC<PdfViewerProps> = ({
    src,
    title = 'PDF Document Preview',
    className,
    contentClassName,
    showToolbar = true,
    fitMode = 'FitH',
    emptyState,
    onLoad,
    onError,
}) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [hasError, setHasError] = useState<boolean>(false);

    // Resolve source to an actionable URL
    useEffect(() => {
        setIsLoading(true);
        setHasError(false);

        if (!src) {
            setBlobUrl(null);
            setIsLoading(false);
            return;
        }

        let createdUrl: string | null = null;

        try {
            if (src instanceof Blob) {
                createdUrl = URL.createObjectURL(src);
                setBlobUrl(createdUrl);
            } else if (typeof src === 'string') {
                if (src.startsWith('data:application/pdf') || src.startsWith('JVBERi0')) {
                    createdUrl = base64ToBlobUrl(src);
                    setBlobUrl(createdUrl);
                } else {
                    // Standard URL (HTTP/HTTPS/local path)
                    setBlobUrl(src);
                }
            }
        } catch (err: any) {
            console.error('PdfViewer: Failed to parse PDF source', err);
            setHasError(true);
            setIsLoading(false);
            if (onError) onError(err instanceof Error ? err : new Error(String(err)));
        }

        return () => {
            // Revoke created Blob URL on unmount or src change to prevent memory leaks
            if (createdUrl && createdUrl.startsWith('blob:')) {
                URL.revokeObjectURL(createdUrl);
            }
        };
    }, [src, onError]);

    // Build the clean URL with fragment identifiers that strip native browser toolbars
    const viewerUrl = useMemo(() => {
        if (!blobUrl) return null;

        const params: string[] = [];

        if (!showToolbar) {
            params.push('toolbar=0');
            params.push('navpanes=0');
            params.push('scrollbar=1');
            params.push('statusbar=0');
            params.push('messages=0');
        }

        if (fitMode) {
            params.push(`view=${fitMode}`);
        }

        const separator = blobUrl.includes('#') ? '&' : '#';
        return `${blobUrl}${separator}${params.join('&')}`;
    }, [blobUrl, showToolbar, fitMode]);

    if (!src && !isLoading) {
        return (
            <div className={cn('flex flex-col items-center justify-center w-full h-full p-6 text-center text-secondary', className)}>
                {emptyState || (
                    <>
                        <FileWarning className="w-10 h-10 mb-2 opacity-40" />
                        <p className="font-body-md">No PDF document provided.</p>
                    </>
                )}
            </div>
        );
    }

    if (hasError) {
        return (
            <div className={cn('flex flex-col items-center justify-center w-full h-full p-6 text-center text-error', className)}>
                <FileWarning className="w-10 h-10 mb-2" />
                <p className="font-body-md font-medium">Failed to load PDF document.</p>
            </div>
        );
    }

    return (
        <div className={cn('relative w-full h-full bg-surface-container-lowest overflow-hidden', className)}>
            {/* Loading Overlay */}
            {isLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface-container-lowest/80 backdrop-blur-xs gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-secondary font-body-sm animate-pulse">Rendering PDF document...</p>
                </div>
            )}

            {/* Seamless Native PDF Frame */}
            {viewerUrl && (
                <div className="w-full h-full overflow-hidden relative">
                    <iframe
                        title={title}
                        src={viewerUrl}
                        onLoad={() => {
                            setIsLoading(false);
                            if (onLoad) onLoad();
                        }}
                        className={cn(
                            'w-full h-[calc(100%+24px)] -mb-[24px] border-0 bg-white block transition-opacity duration-300',
                            isLoading ? 'opacity-0' : 'opacity-100',
                            contentClassName
                        )}
                    />
                </div>
            )}
        </div>
    );
};

export default PdfViewer;
