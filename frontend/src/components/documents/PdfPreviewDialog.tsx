import React from "react";
import { Dialog } from "../ui/dialog";

export interface IPdfPreviewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string;
    documentName: string;
};

const PdfPreviewDialog: React.FC<IPdfPreviewDialogProps> = ({ isOpen, onClose, pdfUrl, documentName }) => {
    return (
        <Dialog open={isOpen} onClose={onClose} title={documentName} size="md">
            {/* 
              Using negative margins to counteract the Dialog's default padding (p-4) 
              so the PDF sits flush edge-to-edge for a cleaner, premium look.
            */}
            <div
                className="-mx-4 -mb-4 mt-2 shrink-0 h-[80vh] bg-surface-container-lowest overflow-y-auto rounded-b-xl"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                {pdfUrl ? (
                    <iframe
                        src={`${pdfUrl}#toolbar=0&navpanes=0&view=Fit`}
                        title={documentName}
                        className="w-full h-full border-0 bg-white"
                        style={{ display: 'block' }}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-secondary font-body-md">
                            PDF preview is unavailable.
                        </p>
                    </div>
                )}
            </div>
        </Dialog>
    )
}

export default PdfPreviewDialog;