import React from "react";
import { Dialog } from "../ui/dialog";

export interface IHtmlPreviewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    htmlContent?: string;
    documentName: string;
};

const HtmlPreviewDialog: React.FC<IHtmlPreviewDialogProps> = ({ isOpen, onClose, htmlContent, documentName }) => {
    return (
        <Dialog open={isOpen} onClose={onClose} title={`HTML Preview: ${documentName}`} size="md">
            <div
                className="-mx-4 -mb-4 mt-2 shrink-0 h-[80vh] bg-surface-container-lowest overflow-y-auto rounded-b-xl"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                {htmlContent ? (
                    <iframe
                        srcDoc={htmlContent}
                        title={documentName}
                        className="w-full h-full border-0 bg-white"
                        style={{ display: 'block' }}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-secondary font-body-md">
                            HTML preview is unavailable. (Template may not be processed yet)
                        </p>
                    </div>
                )}
            </div>
        </Dialog>
    )
}

export default HtmlPreviewDialog;
