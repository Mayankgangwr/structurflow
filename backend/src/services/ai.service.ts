import { gemini } from "@/config/gemini";
import { ITemplateField, ITemplateSchema } from "@/models/template.model";
import { ExtractedPdfElements } from "@/utils/extractPdfElements";
import { logger } from "@/utils/logger";

// ─────────────────────────────────────────────────────────
// The system prompt that turns  extracted text elements into a template
// ─────────────────────────────────────────────────────────

const TEMPLATE_PROCESSING_PROMPT = `
You are an expert document template analyzer for a system called StructurFlow.

Your job is to analyze extracted text elements from a PDF document (such as an Offer Letter, Invoice, NDA, Employment Agreement, Receipt, etc.) and perform TWO tasks:
1. Identify all dynamic variable fields (converting actual sample values into Handlebars {{placeholders}} if they aren't already).
2. Generate a structured template schema defining every dynamic field.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You will receive a JSON array of extracted PDF text items. Each item has:
- id: A unique numeric identifier for the text element
- text: The text string extracted from that exact position
- page: The page number (1-indexed)
- isBold: Whether the font is bold (optional)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 1: Detect Dynamic Fields vs Static Content
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyze the text items in context to distinguish between dynamic values and static template boilerplate.

WHAT IS DYNAMIC (Must be represented as {{field_name}}):
- Names (Candidate name, employee name, client name, manager name, signatory name)
- Dates (Offer date, joining date, issue date, due date, contract start/end date)
- Addresses & Locations (Street address, city, state, postal code, work location)
- Financial & Monetary values (Base salary, allowances, bonuses, hourly rates, total compensation, taxes, invoice totals)
- Reference / ID Numbers (Offer letter number, candidate ID, invoice number, employee ID, PAN, SSN)
- Roles & Departments (Job title, department name, designation, reporting manager)
- Contact Info (Email addresses, phone numbers)
- Percentage & Rate values (Variable pay %, commission %, discount rate)

WHAT IS STATIC (Keep exactly as-is; DO NOT replace):
- Section headings ("1. Position Details", "2. Compensation", "Terms and Conditions", "Acceptance")
- Labels and keys ("Position:", "Department:", "Base Salary:", "Offer Letter No.", "Date:")
- Standard legal boilerplate and clauses ("Your employment will be subject to...", "Please sign and return...")
- Static company names & brand logos
- Table column headers ("Component", "Annual Amount", "Item", "Quantity", "Price")
- Salutations & prefixes ("Dear", "Subject:", "To,", "For STRUCTUREFLOW", "Accepted by Candidate")
- Signature line prompts ("Authorized Signatory", "Date:")

CRITICAL RULES:
1. If an item ALREADY contains Handlebars syntax like {{candidate_name}}, PRESERVE the exact placeholder name.
2. If an item contains real sample data (e.g., "Rahul Sharma", "SF-2026-9041", "INR 22,00,000"), replace ONLY the variable part with a snake_case placeholder (e.g., "{{candidate_name}}", "{{offer_letter_number}}", "{{base_salary_annual}}").
3. If an item is a sentence containing both static and dynamic parts (e.g., "Dear Rahul,"), replace only the name: "Dear {{candidate_first_name}},".
4. If the same entity appears multiple times across the document (e.g., candidate name in address, salutation, and acceptance block), reuse the EXACT SAME placeholder name.
5. All field names MUST be snake_case (e.g. joining_date, total_compensation_annual).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 2: Generate Template Schema
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For every unique dynamic field identified, define an entry in the "fields" array with:

- fieldName: The exact snake_case placeholder name without braces (e.g., "candidate_name", "joining_date")
- label: Clean, professional human-readable label (e.g., "Candidate Name", "Joining Date", "Base Salary (Annual)")
- type: Exactly one of: "string" | "number" | "date" | "currency" | "boolean"
- required: Boolean. True if the document cannot function without this field (e.g., candidate name, salary), false for optional fields.
- placeholder: The full Handlebars token (e.g., "{{candidate_name}}")
- originalValue: The sample value found in the original document (e.g., "Rahul Sharma", "15 September 2026", "INR 22,00,000"). If the template already had {{placeholder}} syntax, set to "".
- description: A brief, clear explanation of what this field represents.

TYPE CLASSIFICATION:
- "string"   → Names, addresses, job titles, IDs, reference numbers, emails, phone numbers
- "number"   → Quantities, counts, percentage rates (e.g., 15)
- "date"     → Any date (e.g., "03 September 2026", "2026-09-15")
- "currency" → Monetary values (e.g., "INR 22,00,000", "$120,000", "₹4,50,000")
- "boolean"  → Yes/No toggles or conditional clauses

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MUST return a single, valid JSON object with NO markdown code fences and NO surrounding text:

{
  "schema": {
    "version": 1,
    "fields": [
      {
        "fieldName": "candidate_name",
        "label": "Candidate Name",
        "type": "string",
        "required": true,
        "placeholder": "{{candidate_name}}",
        "originalValue": "Rahul Sharma",
        "description": "Full legal name of the candidate"
      },
      {
        "fieldName": "base_salary_annual",
        "label": "Base Salary (Annual)",
        "type": "currency",
        "required": true,
        "placeholder": "{{base_salary_annual}}",
        "originalValue": "INR 22,00,000",
        "description": "Annual base salary before deductions"
      }
    ]
  },
  "replacements": [
    {
      "id": 12,
      "originalText": "Rahul Sharma",
      "templateText": "{{candidate_name}}"
    },
    {
      "id": 18,
      "originalText": "Dear Rahul,",
      "templateText": "Dear {{candidate_first_name}},"
    }
  ]
}

Note:
- "replacements" only needs to contain elements where actual sample data was replaced by a {{placeholder}}.
- If the element was already a {{placeholder}}, you do not need to list it in "replacements", but you MUST still define it in "schema.fields".
`;

export interface IAITemplateResult {
    templateHtml: string;
    schema: ITemplateSchema;
}

export interface IAIExtractedElementsResult {
    schema: ITemplateSchema;
    extractedElements: ExtractedPdfElements;
}

class AIService {

    /**
     * Takes raw HTML from pdf2htmlEX and returns:
     *  1. Modified HTML with {{placeholders}} replacing dynamic values
     *  2. A schema describing every placeholder field
     */
    async processTemplateHtml(rawHtml: string): Promise<IAITemplateResult> {
        logger.info("AI Service: Starting template HTML processing...");

        // PRE-PROCESSING: Strip massive <style> blocks (fonts) to save AI tokens
        const styles: string[] = [];
        let cleanedHtml = rawHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, (match) => {
            styles.push(match);
            return '<!-- [STYLE_BLOCK_REMOVED] -->';
        });

        // Also strip SVG blocks if any (often massive in pdf2htmlEX)
        const svgs: string[] = [];
        cleanedHtml = cleanedHtml.replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, (match) => {
            svgs.push(match);
            return '<!-- [SVG_BLOCK_REMOVED] -->';
        });

        // Also strip base64 image URIs
        const base64Images: string[] = [];
        cleanedHtml = cleanedHtml.replace(/data:image\/[^"'\s\)]+/gi, (match) => {
            base64Images.push(match);
            return 'DATA_IMAGE_REMOVED';
        });

        try {
            const response = await gemini.models.generateContent({
                model: "gemini-3.5-flash",
                contents: [
                    {
                        role: "user",
                        parts: [
                            {
                                text: `${TEMPLATE_PROCESSING_PROMPT}\n\nHere is the HTML content from the PDF conversion. Analyze it and return the JSON output:\n\n${cleanedHtml}`
                            }
                        ]
                    }
                ],
                config: {
                    temperature: 0.1,       // Low temperature = deterministic, consistent output
                    maxOutputTokens: 65536,  // Large limit to handle big HTML documents
                }
            });

            const responseText = response.text?.trim();

            if (!responseText) {
                throw new Error("AI returned empty response");
            }

            // Split the response by our delimiter
            const parts = responseText.split('---END_SCHEMA---');
            if (parts.length !== 2) {
                throw new Error("AI response missing delimiter ---END_SCHEMA---");
            }

            let schemaJsonStr = parts[0].trim();
            // Clean up markdown codeblocks if Gemini adds them
            if (schemaJsonStr.startsWith('```json')) {
                schemaJsonStr = schemaJsonStr.replace(/^```json/, '').replace(/```$/, '').trim();
            }

            let templateHtml = parts[1].trim();
            if (templateHtml.startsWith('```html')) {
                templateHtml = templateHtml.replace(/^```html/, '').replace(/```$/, '').trim();
            }

            const schema: ITemplateSchema = JSON.parse(schemaJsonStr);

            if (!templateHtml || typeof templateHtml !== 'string') {
                throw new Error("AI response missing 'templateHtml' section");
            }

            // POST-PROCESSING: Restore the massive <style> and <svg> blocks
            let finalHtml = templateHtml;
            for (const style of styles) {
                finalHtml = finalHtml.replace('<!-- [STYLE_BLOCK_REMOVED] -->', style);
            }
            for (const svg of svgs) {
                finalHtml = finalHtml.replace('<!-- [SVG_BLOCK_REMOVED] -->', svg);
            }
            // base64 images/assets are handled by template.service.ts now, no need to restore here

            const result: IAITemplateResult = {
                templateHtml: finalHtml,
                schema
            };

            if (!result.schema || !Array.isArray(result.schema.fields)) {
                throw new Error("AI response missing 'schema.fields' array");
            }

            // Cross-validate: every field in schema must exist as {{placeholder}} in HTML
            const missingInHtml: string[] = [];
            const missingInSchema: string[] = [];

            for (const field of result.schema.fields) {
                if (!result.templateHtml.includes(`{{${field.fieldName}}}`)) {
                    missingInHtml.push(field.fieldName);
                }
            }

            // Find all {{placeholders}} in HTML and check they exist in schema
            const placeholderRegex = /\{\{([a-z_][a-z0-9_]*)\}\}/g;
            const htmlPlaceholders = new Set<string>();
            let match;
            while ((match = placeholderRegex.exec(result.templateHtml)) !== null) {
                htmlPlaceholders.add(match[1]);
            }

            const schemaFieldNames = new Set(result.schema.fields.map(f => f.fieldName));
            for (const placeholder of htmlPlaceholders) {
                if (!schemaFieldNames.has(placeholder)) {
                    missingInSchema.push(placeholder);
                }
            }

            if (missingInHtml.length > 0) {
                logger.warn(`AI Service: Schema fields not found in HTML: ${missingInHtml.join(', ')}`);
            }

            if (missingInSchema.length > 0) {
                logger.warn(`AI Service: HTML placeholders not found in schema: ${missingInSchema.join(', ')}`);

                // Auto-fix: add missing placeholders to schema with sensible defaults
                for (const fieldName of missingInSchema) {
                    result.schema.fields.push({
                        fieldName,
                        label: fieldName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
                        type: 'string',
                        required: false,
                        placeholder: `{{${fieldName}}}`,
                        originalValue: '',
                        description: `Auto-detected field: ${fieldName}`,
                    });
                }
            }

            logger.info(`AI Service: Template processed successfully. Found ${result.schema.fields.length} dynamic fields.`);

            return result;

        } catch (error: any) {
            logger.error("AI Service: Template processing failed", error);
            throw new Error(`AI template processing failed: ${error.message}`);
        }
    }

    async processExtractedElements(extractedElements: ExtractedPdfElements): Promise<IAIExtractedElementsResult> {
        // 1. Prepare lightweight text representation (only id, text, page, isBold)
        const textItems = extractedElements.texts.map((el, index) => ({
            id: index,
            text: el.text,
            page: el.page,
            isBold: el.isBold,
        }));

        // 2. Call Gemini
        const response = await gemini.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `${TEMPLATE_PROCESSING_PROMPT}\n\nHere are the extracted PDF text elements:\n\n${JSON.stringify(textItems, null, 2)}`
                        }
                    ]
                }
            ],
            config: {
                temperature: 0.1,
                responseMimeType: "application/json",
            }
        });

        const resultJson = JSON.parse(response.text?.trim() || "{}");
        const schema: ITemplateSchema = resultJson.schema;
        const replacements: Array<{ id: number; templateText: string }> = resultJson.replacements || [];

        // 3. Apply any replacements back to extractedElements in-place
        for (const rep of replacements) {
            if (extractedElements.texts[rep.id]) {
                extractedElements.texts[rep.id].text = rep.templateText;
            }
        }

        return {
            schema,
            extractedElements,
        };
    }
}

const aiService = new AIService();
export default aiService;
