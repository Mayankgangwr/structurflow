import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { useGetDocumentPreviewQuery, useGetDocumentByIdQuery, useExportDocumentMutation, useVerifyDocumentMutation } from '../documentApi';
import PdfViewer from '@/components/ui/pdf-viewer';
import toast from 'react-hot-toast';

interface Props {
    documentId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

const TransformedDocumentPreviewDialog: React.FC<Props> = ({ documentId, isOpen, onClose }) => {
    const { data: previewRes, isLoading, isError } = useGetDocumentPreviewQuery(documentId || '', {
        skip: !isOpen || !documentId
    });

    const [exportDocument, { isLoading: isExportLoading }] = useExportDocumentMutation();
    const [verifyDocument, { isLoading: isVerifyLoading }] = useVerifyDocumentMutation();

    const { data: docRes } = useGetDocumentByIdQuery(documentId || '', {
        skip: !isOpen || !documentId
    });

    // Extract the base64 data URI (data:application/pdf;base64,...)
    const pdfDataUrl = typeof previewRes?.data?.url === 'string' ? previewRes.data.url : '';
    const status = previewRes?.data?.status;

    const handleExport = async () => {
        if (!documentId) return;

        try {
            toast.loading('Preparing download...', { id: 'exporting' });

            const data = await exportDocument(documentId).unwrap();
            const downloadUrl = data.data;

            if (downloadUrl) {
                const rawName = docRes?.data?.document?.originalFileName || docRes?.data?.document?.originalFilename || 'document';
                const baseName = rawName.split('.')[0];
                const fileName = `${baseName}_transformed.pdf`;

                const a = window.document.createElement('a');
                a.href = downloadUrl || pdfDataUrl;
                a.download = fileName;
                window.document.body.appendChild(a);
                a.click();
                window.document.body.removeChild(a);

                toast.success('Document downloaded successfully', { id: 'exporting' });
                return;
            }

            toast.error('No PDF preview data available to export', { id: 'exporting' });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export document', { id: 'exporting' });
        }
    };

    const handleVerify = async () => {
        if (!documentId) return;

        try {
            toast.loading('Verifying document...', { id: 'verifying' });
            await verifyDocument({ documentId, status: 'VERIFIED' }).unwrap();
            toast.success('Document verified successfully', { id: 'verifying' });
        } catch (error) {
            console.error('Verification error:', error);
            toast.error('Failed to verify document', { id: 'verifying' });
        }
    }

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            title="Document Preview"
            size="pdf"
            contentClassName="p-0 overflow-hidden flex-1 flex flex-col min-h-0"
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    {status === "VERIFIED" || status === "EXPORTED" ? (
                        <Button
                            onClick={handleExport}
                            disabled={isLoading || isError || isExportLoading}
                            className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
                        >
                            {isExportLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Export PDF
                        </Button>
                    ) : (
                        <Button
                            onClick={handleVerify}
                            disabled={isLoading || isError || isVerifyLoading || isExportLoading}
                            className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
                        >
                            {isVerifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Verify
                        </Button>
                    )}

                </div>
            }
        >
            <div className="w-full h-[80vh] sm:h-[82vh] bg-surface-container-lowest overflow-hidden flex justify-center">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-secondary text-sm">Generating document preview...</p>
                    </div>
                ) : isError ? (
                    <div className="flex items-center justify-center h-full text-error font-body-lg">
                        Failed to load document preview.
                    </div>
                ) : (
                    <PdfViewer
                        src={pdfDataUrl}
                        title="Document Preview"
                        showToolbar={false}
                        fitMode="FitH"
                        emptyState={
                            <div className="flex items-center justify-center h-full text-secondary font-body-lg">
                                No preview available for this document.
                            </div>
                        }
                    />
                )}
            </div>
        </Dialog>
    );
};

export default TransformedDocumentPreviewDialog;
