'use client';

import React, { useCallback, useState } from 'react';
import { UploadCloud, File, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { useUploadDocumentMutation } from '../documentApi';
import { toast } from 'sonner';

interface FileUploadAreaProps {
  orgId: string;
}

export const FileUploadArea = ({ orgId }: FileUploadAreaProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadDocument] = useUploadDocumentMutation();
  const [isUploading, setIsUploading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const processFile = async (file: File) => {
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Invalid file type. Please upload a PDF, PNG, or JPEG.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10MB.');
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadDocument({ orgId, file }).unwrap();
      if (res.data.warnings?.length > 0) {
        toast.warning(res.data.warnings[0]);
      } else {
        toast.success('Document uploaded successfully');
      }
    } catch (error: any) {
      toast.error(error?.data?.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [orgId, uploadDocument]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div
      className={`relative rounded-xl border-2 border-dashed p-12 transition-all duration-300 ${
        isDragging 
          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' 
          : 'border-zinc-200 hover:border-indigo-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-indigo-500/50 dark:hover:bg-zinc-900/50'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="absolute inset-0 z-50 h-full w-full cursor-pointer opacity-0"
        onChange={handleChange}
        disabled={isUploading}
        accept=".pdf,.png,.jpg,.jpeg"
      />
      
      <div className="flex flex-col items-center justify-center space-y-4 text-center">
        {isUploading ? (
          <div className="rounded-full bg-indigo-100 p-4 dark:bg-indigo-900/30">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
          </div>
        ) : (
          <div className="rounded-full bg-indigo-50 p-4 transition-colors group-hover:bg-indigo-100 dark:bg-zinc-900 dark:group-hover:bg-zinc-800">
            <UploadCloud className="h-8 w-8 text-indigo-500" />
          </div>
        )}
        
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {isUploading ? 'Uploading document...' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            PDF, PNG, or JPEG (max 10MB)
          </p>
        </div>
      </div>
    </div>
  );
};
