import { Queue } from 'bullmq';
import { bullmqConnection } from '@/config/bullmq.config';

export interface TemplateParseJobData {
    type: 'TEMPLATE_PARSE';
    templateId: string;   // Now points to Template collection
    projectId: string;
}

export interface DocumentProcessJobData {
    type: 'DOCUMENT_PROCESS';
    documentId: string;   // Points to Document collection
    projectId: string;
}

export type DocumentJobData = TemplateParseJobData | DocumentProcessJobData;

export const documentQueue = new Queue<DocumentJobData>('document-processing', {
    connection: bullmqConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 24 * 3600 },
        removeOnFail: { age: 7 * 24 * 3600 },
    },
});

export async function enqueueTemplateParse(templateId: string, projectId: string) {
    return documentQueue.add('template-parse', {
        type: 'TEMPLATE_PARSE',
        templateId,
        projectId,
    });
}

export async function enqueueDocumentProcess(documentId: string, projectId: string) {
    return documentQueue.add('document-process', {
        type: 'DOCUMENT_PROCESS',
        documentId,
        projectId,
    });
}
