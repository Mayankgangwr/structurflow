import { Upload } from "lucide-react";
import React from "react";

export interface IUploadDocumentProps {
    projectId: string;
}

const UploadDocument: React.FC<IUploadDocumentProps> = ({ projectId }) => {
    return (
        <>
            {/* <div className="flex flex-col gap-0">
                <h2 className="font-headline-md text-headline-md text-text-primary">Upload Raw Documents</h2>
                <p className="font-body-sm text-body-sm text-secondary">Upload the documents you want to transform using
                    this template. You can upload multiple documents at once.</p>
            </div> */}

            <div
                className="border-2 border-dashed border-border-subtle rounded-xl p-xl flex flex-col items-center justify-center text-center gap-md bg-surface hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group">
                <div
                    className="w-16 h-16 rounded-full bg-surface-container-high group-hover:bg-primary-container/20 flex items-center justify-center text-secondary group-hover:text-primary transition-colors mb-sm">
                    <Upload />
                </div>
                <div className="flex flex-col gap-xs">
                    <p className="font-body-md text-body-md text-text-primary"><span
                        className="font-medium text-primary">Drag and drop</span> your documents here or browse
                        files</p>
                    <p className="font-label-sm text-label-sm text-secondary">PDF, JPG, JPEG, PNG, DOCX up to 50MB</p>
                </div>
                <button
                    className="mt-sm bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md py-sm px-lg rounded-lg transition-colors">
                    Upload Documents
                </button>
            </div>
        </>
    );
};

export default UploadDocument;