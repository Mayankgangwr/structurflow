import { gemini } from "@/config/gemini";
import { ITemplateField, ITemplateSchema } from "@/models/template.model";
import { logger } from "@/utils/logger";

// ─────────────────────────────────────────────────────────
// The system prompt that turns raw HTML into a template
// ─────────────────────────────────────────────────────────

const TEMPLATE_PROCESSING_PROMPT = `
You are an expert document template analyzer for a system called StructurFlow.

Your job is to take HTML that was generated from a PDF document (such as an Offer Letter, Invoice, NDA, Appointment Letter, etc.) and do TWO things:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 1: Create Template HTML
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Analyze the HTML content and identify ALL dynamic/variable values — these are values that would change from document to document. Replace each dynamic value with a Handlebars-style placeholder: {{field_name}}

WHAT IS DYNAMIC (replace these):
- Person names (candidate name, manager name, signatory name)
- Dates (offer date, joining date, contract date)
- Addresses (street, city, state, postal code)
- Financial values (salary, allowances, bonuses, totals, amounts)
- Reference numbers (offer letter number, candidate ID, invoice number)
- Job/role information (job title, department, designation, reporting manager)
- Company-specific variable data (work location, branch, etc.)
- Contact details (email, phone number)
- Any percentage values that are specific to a deal/person (tax rate, variable pay %)

WHAT IS STATIC (DO NOT replace these):
- Section headings ("1. Position Details", "2. Compensation", "Terms and Conditions")
- Labels and field names ("Position:", "Department:", "Base Salary:")
- Legal boilerplate text and standard clauses
- Company name (unless it appears as a variable in a multi-company system)
- Table headers ("Component", "Annual Amount", "Monthly Amount")
- Standard phrases ("Dear", "We are pleased to offer", "Subject:", "To,")
- Signature labels ("Authorized Signatory", "Employee Signature")
- Any instructional/formatting text

CRITICAL RULES:
1. DO NOT modify any HTML tags, attributes, CSS styles, classes, or structure.
2. ONLY replace the text content inside elements — never touch the markup itself.
3. If you see existing {{placeholder}} syntax already in the HTML, KEEP them as-is.
4. Use snake_case for all field names (e.g., candidate_name, base_salary_annual).
5. If the same conceptual value appears multiple times in the document (e.g., the candidate name appears in the greeting AND in the signature block), use the SAME placeholder name in both places.
6. For tabular financial data, create separate fields for each row (base_salary_annual, allowances_annual, variable_pay_annual, total_compensation_annual).
7. Preserve ALL whitespace, line breaks, and formatting exactly as they appear.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TASK 2: Generate Template Schema
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

For every unique {{placeholder}} you created in the HTML, generate a field definition with:

- fieldName: The exact placeholder name (must match what's in the HTML)
- label: A clean, human-readable label (e.g., "Candidate Name", "Base Salary (Annual)")
- type: One of: "string", "number", "date", "currency", "boolean"
- required: true if the field is essential for the document to make sense
- placeholder: The {{field_name}} syntax (e.g., "{{candidate_name}}")
- originalValue: The actual value that was in the original HTML before you replaced it (e.g., "Rahul Sharma", "₹18,00,000"). If the original already had a placeholder like {{candidate_name}}, set this to an empty string "".
- description: A short description of what this field represents

TYPE CLASSIFICATION RULES:
- "string" → names, addresses, titles, reference numbers, general text
- "number" → quantities, counts, percentages
- "date" → any date value (joining date, offer date, contract start date)
- "currency" → any monetary value (salary, allowances, bonuses, amounts with ₹, $, etc.)
- "boolean" → yes/no or true/false fields (rare in documents)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You MUST return the output in exactly TWO sections, separated by the delimiter "---END_SCHEMA---".

SECTION 1: The JSON Schema
Return a VALID JSON object representing the schema. Do NOT wrap the HTML inside this JSON.
{
  "version": 1,
  "fields": [
    {
      "fieldName": "candidate_name",
      "label": "Candidate Name",
      "type": "string",
      "required": true,
      "placeholder": "{{candidate_name}}",
      "originalValue": "Rahul Sharma",
      "description": "Full name of the candidate"
    }
  ]
}

---END_SCHEMA---

SECTION 2: The Modified HTML
Return the complete modified HTML string with all {{placeholders}} injected.
<html xmlns=...
...
</html>

IMPORTANT:
- Return exactly two sections separated by "---END_SCHEMA---".
- Do not wrap the JSON or HTML in markdown code blocks if possible.
- Every {{placeholder}} in the HTML must have a corresponding entry in the schema fields array.
- Every entry in the schema fields array must have a corresponding {{placeholder}} in the HTML.
`;


export interface IAITemplateResult {
    templateHtml: string;
    schema: ITemplateSchema;
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
}

const aiService = new AIService();
export default aiService;
