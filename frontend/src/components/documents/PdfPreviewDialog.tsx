import React from "react";
import { Dialog } from "../ui/dialog";
import PdfViewer from "@/components/ui/pdf-viewer";

export interface IPdfPreviewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string;
    documentName: string;
}

const PdfPreviewDialog: React.FC<IPdfPreviewDialogProps> = ({ isOpen, onClose, pdfUrl, documentName }) => {
    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            title={documentName}
            size="pdf"
            contentClassName="p-0 overflow-hidden flex-1 flex flex-col min-h-0"
        >
            <div className="w-full h-[80vh] sm:h-[82vh] bg-surface-container-lowest overflow-hidden flex justify-center">
                <PdfViewer
                    src={pdfUrl}
                    title={documentName}
                    showToolbar={false}
                    fitMode="FitH"
                    emptyState={
                        <div className="flex items-center justify-center h-full">
                            <p className="text-secondary font-body-md">
                                PDF preview is unavailable.
                            </p>
                        </div>
                    }
                />
            </div>
        </Dialog>
    );
};

export default PdfPreviewDialog;