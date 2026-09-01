import { ITargetSchema } from "@/models/template.model";
import { pdfParserService } from "./pdf-parser.service";
import { ApiErrors } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { config } from "@/config/env";
import { geminiClient, defaultGeminiConfig } from "@/config/gemini.config";
import { htmlGeneratorService } from "./html-generator.service";

class TemplateParserService {
    async parseTemplate(pdfUrl: string): Promise<{ schema: ITargetSchema; htmlTemplate: string }> {
        const parsedPdf = await pdfParserService.extractFromUrl(pdfUrl);

        if (!parsedPdf.rawText || parsedPdf.rawText.trim().length === 0) {
            throw ApiErrors.templateNoExtractableText();
        }

        const llmResult = await this.generateSchemaAndMappingFromText(parsedPdf.rawText);
        
        const htmlTemplate = htmlGeneratorService.generateTemplate(parsedPdf, llmResult.fieldMapping);

        return { schema: llmResult.schema, htmlTemplate };
    }

    private async generateSchemaAndMappingFromText(templateText: string): Promise<{ schema: ITargetSchema; fieldMapping: Record<string, string> }> {
        const prompt = `You are an expert document analyst.
        Analyze the following template document text and do two things:
        1. Extract a structured schema that defines what dynamic data fields this template expects.
        2. Create a 'fieldMapping' that maps the EXACT literal text found in the document to its dynamic {{field_name}} placeholder.
        
        For example, if the document says "Dear John Doe", and John Doe is the candidate name, the field mapping should be:
        "John Doe": "{{candidate_name}}"
        
        If the document says "Salary: 800000", the mapping should be:
        "800000": "{{annual_salary}}"
        
        For the schema fields:
        - "name": snake_case identifier (e.g. candidate_name)
        - "type": one of string, number, date, boolean, array, object
        - "required": true or false
        - "description": brief explanation of the field
        
        Also determine the "documentType" (e.g., "invoice", "offer_letter").
        
        TEMPLATE TEXT:
        ---
        ${templateText.substring(0, 10000)}
        ---
        
        Respond ONLY with a valid JSON object matching this structure:
        {
            "schema": {
                "documentType": "string",
                "fields": [
                    { "name": "candidate_name", "type": "string", "required": true, "description": "..." }
                ]
            },
            "fieldMapping": {
                "John Doe": "{{candidate_name}}"
            }
        }`;

        try {
            const response = await geminiClient.models.generateContent({
                model: defaultGeminiConfig.model,
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.1,
                },
            });

            const text = response.text;
            if (!text) throw ApiErrors.emptyLlmResponse();

            const result = JSON.parse(text);
            if (!result.schema || !result.schema.documentType || !Array.isArray(result.schema.fields) || !result.fieldMapping) {
                throw ApiErrors.invalidLlmSchema();
            }

            logger.info(`Template parsed: ${result.schema.documentType} — ${result.schema.fields.length} fields. Found ${Object.keys(result.fieldMapping).length} mappings.`);
            return result;
        } catch (error: any) {
            logger.error("Template schema generation failed:", error);
            throw ApiErrors.templateSchemaGenerationFailed(error.message);
        }
    }
}

const templateParserService = new TemplateParserService();
export default templateParserService;