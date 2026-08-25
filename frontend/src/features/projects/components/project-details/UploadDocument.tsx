import { useUploadDocument } from "@/features/documents/hooks/useUploadDocument";
import { Upload, Loader2 } from "lucide-react";
import React, { useRef, useState } from "react";

export interface IUploadDocumentProps {
    projectId: string;
}

const UploadDocument: React.FC<IUploadDocumentProps> = ({ projectId }) => {
    const { uploadFile, isLoading, isError, error } = useUploadDocument(projectId);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = async (file: File) => {
        try {
            await uploadFile(file);
        } catch (e) {
            // Errors are handled by the hook state
        }
    };

    const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <>
            {/* <div className="flex flex-col gap-0">
                <h2 className="font-headline-md text-headline-md text-text-primary">Upload Raw Documents</h2>
                <p className="font-body-sm text-body-sm text-secondary">Upload the documents you want to transform using
                    this template. You can upload multiple documents at once.</p>
            </div> */}

            <div
                className={`flex-1 w-full border-2 border-dashed rounded-xl p-xl flex flex-col items-center justify-center text-center gap-md transition-all cursor-pointer group min-h-[250px] lg:min-h-[300px] ${isDragging ? 'border-primary bg-primary-container/10' : 'border-primary/40 bg-primary/2 hover:border-primary hover:bg-primary/5'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={onFileInputChange}
                    accept=".pdf,.jpg,.jpeg,.png,.docx"
                />

                <div
                    className="w-16 h-16 rounded-full bg-surface-container-high group-hover:bg-primary-container/20 flex items-center justify-center text-secondary group-hover:text-primary transition-colors mb-sm group-hover:scale-110 duration-300">
                    {isLoading ? <Loader2 className="animate-spin text-primary" /> : <Upload />}
                </div>
                <div className="flex flex-col gap-xs">
                    <p className="font-body-md text-body-md text-text-primary"><span
                        className="font-medium text-primary">Drag and drop</span> your documents here or browse
                        files</p>
                    <p className="font-label-sm text-label-sm text-secondary">PDF, JPG, JPEG, PNG, DOCX up to 50MB</p>
                </div>

                {isError && (
                    <p className="text-error font-body-sm mt-2 bg-error/10 px-4 py-2 rounded-md">{error as string}</p>
                )}

                <button
                    disabled={isLoading}
                    onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                    }}
                    className="mt-sm bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md py-sm px-lg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoading ? "Uploading..." : "Upload Documents"}
                </button>
            </div>
        </>
    );
};

export default UploadDocument;