import React from 'react';
import { Dialog } from "@/components/ui/dialog";
import { Template } from '@/features/templates/templateApi';
import { Badge } from '@/components/ui/badge';

interface ITemplateSchemaDialogProps {
    isOpen: boolean;
    onClose: () => void;
    template: Template;
}

const TemplateSchemaDialog: React.FC<ITemplateSchemaDialogProps> = ({ isOpen, onClose, template }) => {
    const schema = template?.targetSchema;

    if (!schema) return null;

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            title="Template Schema"
            description="The AI successfully parsed this template and extracted the following required data structure."
            size="xl"
        >
            <div className="flex items-center gap-2 mb-6 p-4 bg-surface-container rounded-lg border border-border-subtle">
                <span className="font-label-md text-secondary">Document Type:</span>
                <Badge variant="secondary" className="font-headline-sm uppercase tracking-wider">{schema.documentType}</Badge>
            </div>

            <h4 className="font-headline-sm text-text-primary mb-3">Extracted Fields ({schema.fields.length})</h4>

            <div className="border border-border-subtle rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-surface-container border-b border-border-subtle">
                        <tr>
                            <th className="py-2 px-4 font-label-md text-secondary">Field Name</th>
                            <th className="py-2 px-4 font-label-md text-secondary">Type</th>
                            <th className="py-2 px-4 font-label-md text-secondary">Description</th>
                            <th className="py-2 px-4 font-label-md text-secondary">Required</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                        {schema.fields.map((field, idx) => (
                            <tr key={idx} className="hover:bg-surface/50 transition-colors">
                                <td className="py-3 px-4 font-mono text-xs text-primary">{field.name}</td>
                                <td className="py-3 px-4">
                                    <Badge variant="outline" className="text-xs bg-surface">{field.type}</Badge>
                                </td>
                                <td className="py-3 px-4 text-secondary text-xs">{field.description || '-'}</td>
                                <td className="py-3 px-4">
                                    {field.required ? (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-error-container/50 text-error border border-error-container">
                                            Yes
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-container text-secondary border border-border-subtle">
                                            No
                                        </span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Dialog>
    );
};

export default TemplateSchemaDialog;
