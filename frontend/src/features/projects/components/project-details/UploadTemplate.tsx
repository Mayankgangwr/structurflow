import React, { useRef, useState } from "react";
import { Braces, Files, FileText, Sheet, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUploadTemplate } from "@/features/templates/hooks/useUploadTemplate";

export interface IUploadTemplateProps {
    projectId: string;
}

const UploadTemplate: React.FC<IUploadTemplateProps> = ({ projectId }) => {
    const { uploadFile, isLoading, isError, error } = useUploadTemplate(projectId);
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
        <div className="bg-surface rounded-xl border border-border-subtle overflow-hidden relative transition-all duration-200 hover:border-primary/30 group flex-1 flex flex-col">
            <div 
                className={`p-lg md:p-xl flex-1 flex flex-col items-center justify-center text-center min-h-[320px] border-2 border-dashed rounded-lg m-md transition-colors cursor-pointer ${isDragging ? 'border-primary bg-primary-container/10' : 'border-border-subtle bg-background/50 hover:bg-background'}`}
                id="dropzone"
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
                    accept=".pdf,.docx,.xlsx,.csv,.json"
                />
                
                <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    {isLoading ? <Loader2 className="animate-spin text-primary" /> : <Upload />}
                </div>
                
                <h3 className="font-headline-md text-headline-md text-text-primary mb-2">Upload Transformation Template</h3>
                
                <p className="font-body-sm text-body-sm text-secondary mb-6">
                    Drag and drop your template here, or <span className="text-primary hover:underline font-medium focus:outline-none">browse files</span>
                </p>
                
                <div className="flex flex-wrap items-center justify-center gap-3 font-label-sm text-label-sm text-secondary mb-8">
                    <span className="flex items-center gap-1 bg-surface border border-border-subtle px-2 py-1 rounded">
                        <Files className='h-3 w-3' /> PDF
                    </span>
                    <span className="flex items-center gap-1 bg-surface border border-border-subtle px-2 py-1 rounded">
                        <FileText className='h-3 w-3' /> DOCX
                    </span>
                    <span className="flex items-center gap-1 bg-surface border border-border-subtle px-2 py-1 rounded">
                        <Sheet className='h-3 w-3' /> XLSX, CSV
                    </span>
                    <span className="flex items-center gap-1 bg-surface border border-border-subtle px-2 py-1 rounded">
                        <Braces className='h-3 w-3' /> JSON
                    </span>
                </div>
                
                <p className="font-label-sm text-label-sm text-outline mb-4">Maximum file size: 50MB</p>
                
                {isError && (
                    <p className="text-error font-body-sm mb-4 bg-error/10 px-4 py-2 rounded-md">{error as string}</p>
                )}
                
                <Button
                    disabled={isLoading}
                    className={`px-6 py-4 bg-primary text-white! hover:text-white! mb-md font-label-md hover:bg-primary-container transition-colors shrink-0 rounded-md text-label-md`}
                    onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                    }}
                >
                    {isLoading ? "Uploading..." : "Select Template File"}
                </Button>
            </div>
        </div>
    );
};

export default UploadTemplate;