import React, { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { useGetDocumentByIdQuery } from '../documentApi';
import toast from 'react-hot-toast';

interface Props {
    documentId: string | null;
    isOpen: boolean;
    onClose: () => void;
}

const TransformedDocumentPreviewDialog: React.FC<Props> = ({ documentId, isOpen, onClose }) => {
    const { data, isLoading, isError } = useGetDocumentByIdQuery(documentId || '', {
        skip: !isOpen || !documentId
    });

    const [hydratedHtml, setHydratedHtml] = useState<string>('');
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (data?.data) {
            const { document, templateHtml } = data.data;
            if (templateHtml && document.processingDetails?.aiResponse?.data?.fields) {
                let html = templateHtml;
                const fields = document.processingDetails.aiResponse.data.fields;
                
                fields.forEach((field: any) => {
                    const regex = new RegExp(field.placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                    html = html.replace(regex, field.originalValue || '');
                });

                setHydratedHtml(html);
            } else if (templateHtml) {
                setHydratedHtml(templateHtml);
            }
        }
    }, [data]);

    const handleExport = async () => {
        if (!documentId) return;

        try {
            setIsExporting(true);
            toast.loading('Generating high-fidelity PDF...', { id: 'exporting' });
            
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

            const response = await fetch(`${baseUrl}/api/v1/documents/${documentId}/export`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to export document');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = window.document.createElement('a');
            a.href = url;
            a.download = `${data?.data?.document?.originalFileName?.split('.')[0] || 'document'}_exported.pdf`;
            window.document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            window.document.body.removeChild(a);

            toast.success('Document exported successfully', { id: 'exporting' });
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export document', { id: 'exporting' });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Dialog 
            open={isOpen} 
            onClose={onClose} 
            title="Document Preview" 
            size="xl"
            footer={
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button
                        onClick={handleExport}
                        disabled={isLoading || isError || !hydratedHtml || isExporting}
                        className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2"
                    >
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Export PDF
                    </Button>
                </div>
            }
        >
            <div
                className="-mx-4 -mb-4 mt-2 shrink-0 h-[80vh] bg-surface-container-lowest rounded-b-xl"
                style={{ WebkitOverflowScrolling: 'touch' }}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : isError ? (
                    <div className="flex items-center justify-center h-full text-error font-body-lg">
                        Failed to load document preview.
                    </div>
                ) : hydratedHtml ? (
                    <iframe 
                        title="Document Preview"
                        srcDoc={hydratedHtml}
                        className="w-full h-full border-0 bg-white rounded-b-xl"
                        style={{ display: 'block' }}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-secondary font-body-lg">
                        No preview available for this document.
                    </div>
                )}
            </div>
        </Dialog>
    );
};

export default TransformedDocumentPreviewDialog;
