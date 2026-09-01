"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Document, useGetDocumentByIdQuery, useVerifyDocumentMutation } from '@/features/documents/documentApi';
import { useGetProjectByIdQuery } from '@/features/projects/projectApi';
import { Template } from '@/features/templates/templateApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, AlertTriangle, Save, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface IDocumentReviewProps {
    projectId: string;
    documentId: string;
}

const DocumentReview: React.FC<IDocumentReviewProps> = ({ projectId, documentId }) => {
    const router = useRouter();

    const { data: docData, isLoading: isDocLoading } = useGetDocumentByIdQuery(documentId);
    const { data: projectData, isLoading: isProjectLoading } = useGetProjectByIdQuery(projectId);
    const [verifyDocument, { isLoading: isVerifying }] = useVerifyDocumentMutation();

    const [formData, setFormData] = useState<Record<string, any>>({});
    const [localErrors, setLocalErrors] = useState<Array<{field: string; message: string; severity: string}>>([]);

    const document = docData?.data?.document;
    const templateData: Template | undefined = projectData?.data?.templateData;
    const targetSchema = templateData?.targetSchema;

    // Initialize form data from structuredData when loaded
    useEffect(() => {
        if (document?.structuredData) {
            setFormData(document.structuredData);
        }
        if (document?.validationResult?.errors) {
            setLocalErrors(document.validationResult.errors);
        }
    }, [document?.structuredData, document?.validationResult?.errors]);

    if (isDocLoading || isProjectLoading) {
        return (
            <div className="p-8 flex justify-center items-center min-h-[400px] text-secondary">
                <RefreshCw className="animate-spin h-8 w-8" />
            </div>
        );
    }

    if (!document || !targetSchema) {
        return (
            <div className="p-8 text-center text-error">
                Document or Template schema not found.
            </div>
        );
    }

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Clear the error for this field once the user starts typing
        setLocalErrors(prev => prev.filter(e => e.field !== field));
    };

    const handleSave = async () => {
        try {
            await verifyDocument({
                documentId,
                verifiedData: formData
            }).unwrap();

            toast.success('Document verified successfully');
            router.push(`/project/${projectId}`);
        } catch (error: any) {
            toast.error(error?.data?.message || 'Failed to verify document');
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-subtle bg-surface shrink-0">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/project/${projectId}`)}
                        className="text-secondary hover:text-primary p-2"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="font-headline-sm text-text-primary">Review Document</h1>
                        <p className="text-xs text-secondary mt-1">
                            {document.originalFileName || document.originalFilename}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-border-subtle text-xs font-medium">
                        Confidence:
                        <span className={cn(
                            "font-bold",
                            (document.validationResult?.confidence || 0) >= 0.8 ? "text-tertiary" :
                                (document.validationResult?.confidence || 0) >= 0.5 ? "text-warning" : "text-error"
                        )}>
                            {Math.round((document.validationResult?.confidence || 0) * 100)}%
                        </span>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={isVerifying}
                        className="bg-primary !text-white hover:!text-white hover:bg-primary-container px-4 py-2 font-label-md transition-colors"
                    >
                        {isVerifying
                            ? <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                            : <Save className="h-4 w-4 mr-2" />
                        }
                        Save & Verify
                    </Button>
                </div>
            </div>

            {/* Split View */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left: PDF Preview */}
                <div className="w-1/2 border-r border-border-subtle bg-surface-container/30 relative flex flex-col">
                    <div className="p-2 border-b border-border-subtle bg-surface flex justify-between items-center shrink-0">
                        <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Source Document</span>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        <iframe
                            src={`${document.secureUrl}#toolbar=0&navpanes=0`}
                            className="w-full h-full border-0 absolute inset-0"
                            title="PDF Preview"
                        />
                    </div>
                </div>

                {/* Right: Extraction Form */}
                <div className="w-1/2 flex flex-col bg-surface overflow-hidden">
                    <div className="p-2 border-b border-border-subtle bg-surface flex justify-between items-center shrink-0">
                        <span className="text-xs font-semibold text-secondary uppercase tracking-wider">Extracted Data</span>
                        {localErrors.length > 0 && (
                            <span className="text-xs font-medium text-error flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {localErrors.length} validation {localErrors.length === 1 ? 'error' : 'errors'}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="max-w-2xl mx-auto space-y-6">
                            {targetSchema.fields.map((field) => {
                                const error = localErrors.find(e => e.field === field.name);

                                return (
                                    <div key={field.name} className="space-y-2 relative">
                                        <div className="flex justify-between items-center">
                                            <Label
                                                htmlFor={field.name}
                                                className={cn(
                                                    "text-sm font-semibold",
                                                    error ? "text-error" : "text-text-primary"
                                                )}
                                            >
                                                {field.name} {field.required && <span className="text-error">*</span>}
                                            </Label>
                                            <span className="text-[10px] uppercase text-secondary bg-surface-container px-1.5 py-0.5 rounded">
                                                {field.type}
                                            </span>
                                        </div>

                                        <Input
                                            id={field.name}
                                            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                            value={formData[field.name] ?? ''}
                                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                                            className={cn(
                                                "w-full transition-all focus:ring-1",
                                                error ? "border-error focus:ring-error focus:border-error bg-error-container/10"
                                                    : "focus:ring-primary focus:border-primary"
                                            )}
                                            placeholder={field.description || `Enter ${field.name}`}
                                        />

                                        {error ? (
                                            <p className="text-xs text-error mt-1 flex items-center gap-1">
                                                <AlertTriangle className="h-3 w-3" />
                                                {error.message}
                                            </p>
                                        ) : (
                                            field.description && (
                                                <p className="text-xs text-secondary mt-1">{field.description}</p>
                                            )
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DocumentReview;
