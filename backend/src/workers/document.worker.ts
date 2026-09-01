import { bullmqConnection } from "@/config/bullmq.config";
import { DocumentJobData } from "@/jobs/document.queue";
import { DocumentModel, DocumentStatus } from "@/models/document.model";
import { TemplateModel, TemplateStatus } from "@/models/template.model";
import llmMappingService from "@/services/llm-mapping.service";
import { pdfParserService } from "@/services/pdf-parser.service";
import templateParserService from "@/services/template-parser.service";
import validationService from "@/services/validation.service";
import { ApiErrors } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { Job, Worker } from "bullmq";

export const documentWorker = new Worker<DocumentJobData>('document-processing',
    async (job: Job<DocumentJobData>) => {
        logger.info(`[Worker] Proccessing: ${job.name} — ${job.data.type}`);

        switch (job.data.type) {
            case `TEMPLATE_PARSE`:
                await handletemplateParse(job.data.templateId);
                break;
            case 'DOCUMENT_PROCESS':
                await handleDocumentProcess(job.data.documentId, job.data.projectId, job);
                break;
        }

    },
    { connection: bullmqConnection, concurrency: 2 }
);

documentWorker.on('completed', (job) => {
    logger.info(`[Worker] Completed: ${job.id}`);
});

documentWorker.on('failed', (job, err) => {
    logger.info(`[Worker] Failed: ${job?.id} — ${err.message}`);
});


// ═══════════════════════════════════════
// TEMPLATE PARSE — Template → Target Schema
// ═══════════════════════════════════════

async function handletemplateParse(templateId: string) {
    const template = await TemplateModel.findById(templateId);
    if (!template) throw ApiErrors.templateNotFound();

    try {
        template.status = TemplateStatus.PROCESSING;
        await template.save();

        const parsedResult = await templateParserService.parseTemplate(template.secureUrl);

        template.targetSchema = parsedResult.schema;
        template.htmlTemplate = parsedResult.htmlTemplate;
        template.status = TemplateStatus.PARSED;
        await template.save();

        logger.info(`[Worker] template pared: ${parsedResult.schema.documentType} — ${parsedResult.schema.fields.length} fields`);
    } catch (error: any) {
        template.status = TemplateStatus.FAILED;
        template.processingError = error.message;
        await template.save();
        throw error;
    }
}

// ═══════════════════════════════════════
// DOCUMENT PROCESS — Full pipeline
// ═══════════════════════════════════════
async function handleDocumentProcess(documentId: string, projectId: string, job: Job) {
    const doc = await DocumentModel.findById(documentId);
    if (!doc) throw ApiErrors.documentNotFound();

    try {
        // Step 1: PROCESSING
        doc.status = DocumentStatus.PROCESSING;
        doc.processingStartedAt = new Date();
        await doc.save();
        await job.updateProgress(10);

        // Step 2: EXTRACT text from PDF
        const parsedPdf = await pdfParserService.extractFromUrl(doc.secureUrl);
        doc.sourceData = {
            rawText: parsedPdf.rawText,
            pages: parsedPdf.pages,
            metadata: parsedPdf.metadata
        };

        doc.status = DocumentStatus.EXTRACTED;
        await doc.save();
        await job.updateProgress(30);

        logger.info(`[Worker] Extracted ${parsedPdf.pages} pages from ${doc.originalFileName}`);

        // Step 3: Fetch the project's template Target Schema
        const template = await TemplateModel.findOne({
            projectId: doc.projectId,
            isDeleted: { $ne: true },
            targetSchema: { $ne: null },
            status: TemplateStatus.PARSED
        }).sort({ createdAt: -1 });

        if (!template?.targetSchema) throw ApiErrors.missingParsedTemplate();

        // Step 4: LLM MAPPING
        doc.status = DocumentStatus.MAPPING;
        await doc.save();
        await job.updateProgress(50);

        const structureData = await llmMappingService.mapDocument(parsedPdf.rawText, template.targetSchema);
        doc.structuredData = structureData;
        await job.updateProgress(70);

        // Step 5: DETERMINISTIC VALIDATION
        doc.status = DocumentStatus.VALIDATING;
        await doc.save();

        const validationResult = validationService.validate(structureData, template.targetSchema);
        doc.validationResult = validationResult;
        await job.updateProgress(90);

        // Step 6: ROUTING DECISION
        if (validationResult.isValid && validationResult.confidence >= 0.8) {
            doc.status = DocumentStatus.TRUSTED;
            logger.info(`[Worker] TRUSTED (confidence: ${validationResult.confidence})`);
        } else {
            doc.status = DocumentStatus.REVIEW_REQUIRED;
            logger.info(`[Worker] REVIEW_REQUIRED (confidence: ${validationResult.confidence})`);
        }

        doc.processingCompletedAt = new Date();
        await doc.save();
        await job.updateProgress(100);
    } catch (error: any) {
        doc.status = DocumentStatus.FAILED;
        doc.processingError = error.message;
        doc.processingCompletedAt = new Date();
        await doc.save();
        throw error
    }
}