import templateRepository from "@/repositories/template.repository";
import { ApiErrors, DomainError } from "@/utils/errors";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { storageService } from "@/integrations/storage.service";
import mongoose from "mongoose";
import { TemplateStatus } from "@/models/template.model";
import auditLogRepository from "@/repositories/audit-log.repository";
import { AuditAction } from "@/models/audit-log.model";
import projectRepository from "@/repositories/project.repository";
import pdfService from "./pdf.service";
import aiService from "./ai.service";


class TemplateService {
    /**
     * Extracts base64 images from HTML, uploads them to Supabase, and replaces the strings with URLs
     */
    private async replaceBase64AssetsWithUrls(html: string, organizationId: string): Promise<string> {
        const regex = /data:([a-zA-Z0-9-]+\/[a-zA-Z0-9-+.]+);base64,([^"'\s\)]+)/gi;
        const matches = [...html.matchAll(regex)];

        if (matches.length === 0) return html;

        let processedHtml = html;

        for (const match of matches) {
            const fullMatch = match[0];
            const mimeType = match[1]; // e.g., 'image/png'
            const base64Data = match[2];

            const extension = mimeType.split('/')[1] || 'png';
            const filename = `template-asset-${uuidv4()}.${extension}`;
            const folder = `structurflow/${organizationId}/assets`;

            try {
                const buffer = Buffer.from(base64Data, 'base64');
                const uploadResult = await storageService.uploadFile(buffer, folder, filename, mimeType);
                
                processedHtml = processedHtml.replace(fullMatch, uploadResult.secure_url);
            } catch (err) {
                console.error('Failed to upload extracted image, keeping base64 format:', err);
            }
        }

        return processedHtml;
    }

    /**
* Processes a direct file upload from the client.
*/

    async uploadTemplate(
        file: Express.Multer.File,
        organizationId: string,
        projectId: string,
        userId: string,
        ipAddress?: string
    ) {
        // 1. Calculate SHA-256 hash of the file buffer
        const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

        // 2. Check for exact duplicates in the same organization

        const duplicateCount = await templateRepository.countByOrgAndHash(organizationId, fileHash);
        const isDuplicate = duplicateCount > 0;

        if (isDuplicate) throw ApiErrors.duplicateTemplate();

        // 3. Define Local Folder and Filename
        const folder = `structurflow/${organizationId}`;
        const extension = path.extname(file.originalname);
        const filename = `${uuidv4()}${extension}`;

        // 4. Upload directly to Supabase Storage
        const uploadResult = await storageService.uploadFile(file.buffer, folder, filename, file.mimetype);

        // 5. Persist Document and Audit Log (Without Transactions for standalone DB)
        try {
            const document = await templateRepository.create({
                organizationId: new mongoose.Types.ObjectId(organizationId),
                projectId: new mongoose.Types.ObjectId(projectId),
                uploadedById: new mongoose.Types.ObjectId(userId),
                originalFileName: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                fileHash,
                publicId: uploadResult.public_id,
                secureUrl: uploadResult.secure_url,
                status: TemplateStatus.UPLOADED,
            });

            await projectRepository.updateTemplate(projectId, document._id as mongoose.Types.ObjectId);

            await auditLogRepository.create({
                organizationId: new mongoose.Types.ObjectId(organizationId),
                actorId: new mongoose.Types.ObjectId(userId),
                documentId: document._id as mongoose.Types.ObjectId,
                action: AuditAction.TEMPLATE_UPLOADED,
                details: {
                    filename: file.originalname,
                    size: file.size,
                    isDuplicateWarning: isDuplicate
                },
                ipAddress
            });

            // Note: In Phase 4, we will queue the BullMQ processing job right here!

            return {
                document,
                warnings: isDuplicate ? ['An identical file has been uploaded previously.'] : []
            };
        } catch (error: any) {
            console.error('--- UPLOAD DOCUMENT ERROR ---', error);
            // Attempt to clean up the orphaned Cloudinary file asynchronously
            storageService.deleteFile(uploadResult.public_id).catch(() => { });

            if (error instanceof DomainError) throw error;
            throw new Error(`Failed to save document record: ${error.message}`);
        }
    }

    async proccessTemplate(templateId: string) {
        const template = await templateRepository.findById(templateId);
        if (!template) throw ApiErrors.templateNotFound();

        // Step 1: Update status to PROCESSING
        await templateRepository.updateById(templateId, {
            status: TemplateStatus.PROCESSING,
            processingProgress: {
                stage: 'HTML_GENERATION',
                percentage: 10,
                message: 'Converting PDF to HTML...',
            },
        });

        try {
            // Step 2: Convert PDF to HTML (using pdf2htmlEX via Docker)
            let rawHtml = await pdfService.convertPdfToHtml(template.secureUrl);

            // Step 2.5: Optimize HTML by uploading Base64 images to Supabase
            await templateRepository.updateById(templateId, {
                processingProgress: {
                    stage: 'HTML_GENERATION',
                    percentage: 25,
                    message: 'Optimizing template assets...',
                },
            });
            rawHtml = await this.replaceBase64AssetsWithUrls(rawHtml, template.organizationId.toString());

            await templateRepository.updateById(templateId, {
                processingProgress: {
                    stage: 'FIELD_DETECTION',
                    percentage: 40,
                    message: 'Detecting dynamic fields and generating placeholders...',
                },
            });

            // Step 3: Send raw HTML to Gemini AI for placeholder detection + schema generation
            const aiResult = await aiService.processTemplateHtml(rawHtml);

            await templateRepository.updateById(templateId, {
                processingProgress: {
                    stage: 'SCHEMA_GENERATION',
                    percentage: 80,
                    message: 'Saving template schema...',
                },
            });

            // Step 4: Save processed HTML + schema to DB
            const updatedTemplate = await templateRepository.updateById(templateId, {
                htmlContent: aiResult.templateHtml,
                templateSchema: aiResult.schema,
                status: TemplateStatus.READY,
                processingProgress: {
                    stage: 'COMPLETED',
                    percentage: 100,
                    message: 'Template processed successfully!',
                },
            });

            return updatedTemplate;

        } catch (error: any) {
            // If anything fails, mark the template as FAILED with the error message
            await templateRepository.updateById(templateId, {
                status: TemplateStatus.FAILED,
                processingError: error.message,
                processingProgress: {
                    stage: 'FIELD_DETECTION',
                    percentage: 0,
                    message: `Processing failed: ${error.message}`,
                },
            });

            throw error;
        }
    }
}

const templateService = new TemplateService();

export default templateService;