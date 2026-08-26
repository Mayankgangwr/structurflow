import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useUploadTemplate } from "../hooks/useUploadTemplate";
import { Loader2, Upload, FileIcon, FileText, Image as ImageIcon, CheckCircle, Trash2 } from "lucide-react";
import { formatSize } from "@/lib/utils";

export interface IUploadTemplateFormProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
};

const UploadTemplateForm: React.FC<IUploadTemplateFormProps> = ({ isOpen, onClose, projectId }) => {
    const { uploadFile, isLoading, isError, error } = useUploadTemplate(projectId);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedFile(null);
            setIsDragging(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleFileAdded = (file: File) => {
        setSelectedFile(file);
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
    };

    const handleUploadSubmit = async () => {
        if (!selectedFile) return;
        try {
            await uploadFile(selectedFile);
            onClose();
        } catch (e) {
            // Errors are handled by the hook state
        }
    };

    const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileAdded(e.target.files[0]);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
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
            handleFileAdded(e.dataTransfer.files[0]);
        }
    };

    const getFileIcon = (type: string) => {
        if (type.includes('pdf')) return <FileText className="w-5 h-5 text-secondary" />;
        if (type.includes('image')) return <ImageIcon className="w-5 h-5 text-secondary" />;
        return <FileIcon className="w-5 h-5 text-secondary" />;
    };

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            title="Upload new template"
            description="Upload a new template to start transforming documents."
            size="md"
            footer={
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 sm:gap-2 w-full">
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUploadSubmit}
                        disabled={isLoading || !selectedFile}
                        className="w-full sm:w-auto bg-primary text-white hover:bg-primary-container font-label-md"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                            </>
                        ) : "Upload Template"}
                    </Button>
                </div>
            }
        >
            <div className="py-1 flex flex-col">
                {/* Drag and Drop Zone */}
                <div
                    className={`shrink-0 w-full border-2 border-dashed rounded-xl p-md flex flex-col items-center justify-center text-center gap-xs transition-all cursor-pointer group min-h-40 ${isDragging ? 'border-primary bg-primary/10' : 'border-primary/40 bg-primary/2 hover:border-primary hover:bg-primary/5'
                        }`}
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
                        className="w-12 h-12 rounded-full bg-surface-container-high group-hover:bg-primary-container/20 flex items-center justify-center text-secondary group-hover:text-primary transition-colors mb-sm group-hover:scale-110 duration-300">
                        {isLoading ? <Loader2 className="animate-spin text-primary" /> : <Upload className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col gap-xs">
                        <p className="font-body-md text-body-md text-text-primary font-medium mb-xs">Drag and drop your template here</p>
                        <p className="font-body-sm text-body-sm text-secondary mb-md">or <span className="text-primary hover:underline">click to browse files</span></p>
                    </div>

                    <div className="flex flex-col gap-xs items-center">
                        <p className="font-label-sm text-label-sm text-secondary">You can upload one master document as a template.</p>
                        <p className="font-label-sm text-label-sm text-secondary">Supported formats: PDF, JPG, JPEG, PNG, DOCX (Max size: 25 MB)</p>
                    </div>
                </div>

                {isError && (
                    <p className="text-error font-body-sm mt-3 bg-error/10 px-4 py-2 rounded-md shrink-0">{error as string}</p>
                )}

                {/* SCROLLABLE FILE LIST CONTAINER (for single file) */}
                {selectedFile && (
                    <div className="flex flex-col gap-sm mt-4">
                        <div className="flex items-center justify-between p-md border border-border-subtle rounded-lg bg-surface hover:bg-surface-bright transition-colors shrink-0">
                            <div className="flex items-center gap-md truncate">
                                {getFileIcon(selectedFile.type)}
                                <div className="flex flex-col truncate">
                                    <span className="font-body-sm text-body-sm font-medium text-text-primary truncate" title={selectedFile.name}>{selectedFile.name}</span>
                                    <span className="font-label-sm text-label-sm text-secondary">{formatSize(selectedFile.size)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-md ml-4 shrink-0">
                                <span className="font-label-sm text-label-sm text-tertiary-container flex items-center gap-xs">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    Ready
                                </span>
                                <button
                                    type="button"
                                    disabled={isLoading}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFile();
                                    }}
                                    aria-label="Remove file"
                                    className="text-secondary hover:text-error transition-colors p-xs disabled:opacity-50"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default UploadTemplateForm;