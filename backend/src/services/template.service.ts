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
import extractPdfElements from "@/utils/extractPdfElements";
import generatePdfFromTemplate from "@/utils/generatePdfFromTemplate";
import * as fs from "fs";

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


        // 2. Actual Data JSON
        // const actualData = [
        //     {
        //         fieldName: 'offer_letter_number',
        //         label: 'Offer Letter Number',
        //         type: 'string',
        //         required: true,
        //         placeholder: '{{offer_letter_number}}',
        //         originalValue: 'SF-HR-2026-0847',
        //         description: 'Unique identifier for the offer letter'
        //     },
        //     {
        //         fieldName: 'offer_date',
        //         label: 'Offer Date',
        //         type: 'date',
        //         required: true,
        //         placeholder: '{{offer_date}}',
        //         originalValue: '31 August 2026',
        //         description: 'Date the offer letter was issued'
        //     },
        //     {
        //         fieldName: 'candidate_id',
        //         label: 'Candidate ID',
        //         type: 'string',
        //         required: true,
        //         placeholder: '{{candidate_id}}',
        //         originalValue: null,
        //         description: 'Unique identifier for the candidate'
        //     },
        //     {
        //         fieldName: 'joining_date',
        //         label: 'Joining Date',
        //         type: 'date',
        //         required: true,
        //         placeholder: '{{joining_date}}',
        //         originalValue: '15 September 2026',
        //         description: 'Date the candidate is expected to join'
        //     },
        //     {
        //         fieldName: 'candidate_name',
        //         label: 'Candidate Name',
        //         type: 'string',
        //         required: true,
        //         placeholder: '{{candidate_name}}',
        //         originalValue: 'Rahul Sharma',
        //         description: 'Full legal name of the candidate'
        //     },
        //     {
        //         fieldName: 'candidate_address',
        //         label: 'Candidate Address',
        //         type: 'string',
        //         required: true,
        //         placeholder: '{{candidate_address}}',
        //         originalValue: '42 Green Park Avenue',
        //         description: 'Street address of the candidate'
        //     },
        //     {
        //         fieldName: 'candidate_city',
        //         label: 'Candidate City',
        //         type: 'string',
        //         required: true,
        //         placeholder: '{{candidate_city}}',
        //         originalValue: 'Noida',
        //         description: 'City of the candidate\'s address'
        //     },
        //     {
        //         fieldName: 'candidate_state',
        //         label: 'Candidate State',
        //         type: 'string',
        //         required: true,
        //         placeholder: '{{candidate_state}}',
        //         originalValue: 'Uttar Pradesh',
        //         description: 'State of the candidate\'s address'
        //     },
        //     {
        //         fieldName: 'candidate_postal_code',
        //         label: 'Candidate Postal Code',
        //         type: 'string',
        //         required: true,
        //         placeholder: '{{candidate_postal_code}}',
        //         originalValue: '201301',
        //         description: 'Postal code of the candidate\'s address'
        //     },
        //     {
        //         fieldName: 'candidate_first_name',
        //         label: 'Candidate First Name',
        //         type: 'string',
        //         required: true,
        //         placeholder: '{{candidate_first_name}}',
        //         originalValue: 'Rahul',
        //         description: 'First name of the candidate, used in salutation'
        //     },
        //     {
        //         fieldName: 'job_title',
        //         label: 'Job Title',
        //         type: 'string',
        //         required: true,
        //         placeholder: '{{job_title}}',
        //         originalValue: 'Senior Software Engineer',
        //         description: 'Official job title for the position offered'
        //     },
        //     {
        //         fieldName: 'department_name',
        //         label: 'Department Name',
        //         type: 'string',
        //         required: true,
        //         placeholder: '{{department_name}}',
        //         originalValue: 'Engineering',
        //         description: 'Department the candidate will be working in'
        //     },
        //     {
        //         fieldName: 'employment_type',
        //         label: 'Employment Type',
        //         type: 'string',
        //         required: true,
        //         placeholder: '{{employment_type}}',
        //         originalValue: 'Full-time',
        //         description: 'Type of employment (e.g., Full-time, Part-time, Contract)'
        //     },
        //     {
        //         fieldName: 'work_location',
        //         label: 'Work Location',
        //         type: 'string',
        //         required: true,
        //         placeholder: '{{work_location}}',
        //         originalValue: 'Noida, Uttar Pradesh',
        //         description: 'Primary physical or remote work location'
        //     },
        //     {
        //         fieldName: 'reporting_manager',
        //         label: 'Reporting Manager',
        //         type: 'string',
        //         required: true,
        //         placeholder: '{{reporting_manager}}',
        //         originalValue: 'Ananya Mehta',
        //         description: 'Name of the candidate\'s direct reporting manager'
        //     },
        //     {
        //         fieldName: 'base_salary_annual',
        //         label: 'Base Salary (Annual)',
        //         type: 'currency',
        //         required: true,
        //         placeholder: '{{base_salary_annual}}',
        //         originalValue: '15,60,000',
        //         description: 'Annual base salary before deductions'
        //     },
        //     {
        //         fieldName: 'allowances_annual',
        //         label: 'Allowances (Annual)',
        //         type: 'currency',
        //         required: false,
        //         placeholder: '{{allowances_annual}}',
        //         originalValue: null,
        //         description: 'Total annual allowances'
        //     },
        //     {
        //         fieldName: 'variable_pay_annual',
        //         label: 'Variable / Performance Pay (Annual)',
        //         type: 'currency',
        //         required: false,
        //         placeholder: '{{variable_pay_annual}}',
        //         originalValue: '2,40,000',
        //         description: 'Annual variable or performance-based pay'
        //     },
        //     {
        //         fieldName: 'total_compensation_annual',
        //         label: 'Total Compensation (Annual)',
        //         type: 'currency',
        //         required: true,
        //         placeholder: '{{total_compensation_annual}}',
        //         originalValue: '18,00,000',
        //         description: 'Total annual compensation including base, allowances, and variable pay'
        //     },
        //     {
        //         fieldName: 'company_address',
        //         label: 'Company Address',
        //         type: 'string',
        //         required: true,
        //         placeholder: '{{company_address}}',
        //         originalValue: '5th Floor, Tower B, Sector 62, Noida, Uttar Pradesh 201309',
        //         description: 'Full address of the company'
        //     },
        //     {
        //         fieldName: 'company_email',
        //         label: 'Company Email',
        //         type: 'string',
        //         required: true,
        //         placeholder: '{{company_email}}',
        //         originalValue: 'people@structurflow.example',
        //         description: 'Official email address of the company'
        //     },
        //     {
        //         fieldName: 'company_phone',
        //         label: 'Company Phone',
        //         type: 'string',
        //         required: true,
        //         placeholder: '{{company_phone}}',
        //         originalValue: '+91 120 456 7800',
        //         description: 'Official phone number of the company'
        //     },
        //     {
        //         fieldName: 'authorized_signatory_name',
        //         label: 'Authorized Signatory Name',
        //         type: 'string',
        //         required: true,
        //         placeholder: '{{authorized_signatory_name}}',
        //         originalValue: 'Ananya Mehta',
        //         description: 'Name of the authorized person signing the offer letter'
        //     },
        //     {
        //         fieldName: 'authorized_signatory_title',
        //         label: 'Authorized Signatory Title',
        //         type: 'string',
        //         required: true,
        //         placeholder: '{{authorized_signatory_title}}',
        //         originalValue: 'Head of People Operations',
        //         description: 'Job title of the authorized person signing the offer letter'
        //     },
        //     {
        //         fieldName: 'acceptance_date',
        //         label: 'Acceptance Date',
        //         type: 'date',
        //         required: true,
        //         placeholder: '{{acceptance_date}}',
        //         originalValue: null,
        //         description: 'Date the candidate accepts the offer'
        //     }
        // ];

        // Extract the pdf layout
        const rawExtractedElements = await extractPdfElements({ fileBuffer: file.buffer });

        if (rawExtractedElements === null) throw ApiErrors.faildToDocumentExtraction();

        // AI processes the extracted PDF AST directly:
        const { schema, extractedElements } = await aiService.processExtractedElements(rawExtractedElements);

        // // 3. Generate PDF
        // const pdfBuffer = await generatePdfFromTemplate(extractedElements, actualData, {
        //     templatePdfBuffer: file.buffer
        // });

        // // A) Save to disk:
        // fs.writeFileSync("Generated_Offer_Letter.pdf", pdfBuffer);
        // console.log("Extract Pdf Elements: ", extractedElements);

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
                status: TemplateStatus.READY,
                pageCount: extractedElements.pageCount,
                extractedElements: extractedElements,
                templateSchema: schema,
                isActive: true,
            });

            // Ensure any previous active templates for this project are deactivated
            await templateRepository.deactivateOtherTemplatesInProject(projectId, organizationId, document._id);

            await projectRepository.updateTemplate(projectId, document._id as mongoose.Types.ObjectId);

            await auditLogRepository.create({
                organizationId: new mongoose.Types.ObjectId(organizationId),
                actorId: new mongoose.Types.ObjectId(userId),
                documentId: document._id as mongoose.Types.ObjectId,
                projectId: new mongoose.Types.ObjectId(projectId),
                action: AuditAction.TEMPLATE_UPLOADED,
                details: {
                    filename: file.originalname,
                    originalFileName: file.originalname,
                    size: file.size,
                    status: TemplateStatus.READY,
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

            // Record Audit Log for TEMPLATE_PROCESSED
            try {
                await auditLogRepository.create({
                    organizationId: template.organizationId as mongoose.Types.ObjectId,
                    actorId: template.uploadedById as mongoose.Types.ObjectId,
                    documentId: template._id as mongoose.Types.ObjectId,
                    projectId: template.projectId as mongoose.Types.ObjectId,
                    action: AuditAction.TEMPLATE_PROCESSED,
                    details: {
                        filename: template.originalFileName,
                        originalFileName: template.originalFileName,
                        fieldsDetected: Object.keys(aiResult?.schema?.fields || {}).length,
                        status: TemplateStatus.READY,
                    },
                });
            } catch (auditErr) {
                console.error("Failed to log TEMPLATE_PROCESSED:", auditErr);
            }

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