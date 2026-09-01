import React from 'react';
import DocumentReview from '@/features/documents/components/DocumentReview';

interface IDocumentReviewPageProps {
    params: {
        projectId: string;
        documentId: string;
    };
}

const DocumentReviewPage: React.FC<IDocumentReviewPageProps> = async ({ params }) => {
    const { projectId, documentId } = await params;
    return (
        <DocumentReview projectId={projectId} documentId={documentId} />
    );
};

export default DocumentReviewPage;
