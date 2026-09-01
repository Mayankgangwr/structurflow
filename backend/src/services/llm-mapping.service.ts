import { config } from "@/config/env";
import { geminiClient, defaultGeminiConfig } from "@/config/gemini.config";
import { ITargetSchema } from "@/models/template.model";
import { ApiErrors } from "@/utils/errors";
import { logger } from "@/utils/logger";

class LlmMappingService {
    async mapDocument(sourceText: string, targetSchema: ITargetSchema): Promise<Record<string, any>> {
        const expectedFields = targetSchema.fields.map(f => `"${f.name}": <${f.type}>${f.required ? ' (REQUIRED)' : ''} — ${f.description || f.name}`).join('\n    ');

        const prompt = `You are a data extraction expert. Extract data from the source document and map it to the target schema.
                        TARGET SCHEMA (documentType: "${targetSchema.documentType}"): ${expectedFields}
                        
                        SOURCE DOCUMENT:
                        ---
                        ${sourceText.substring(0, 12000)}
                        ---
                        
                        RULES:
                            1. Map each field semantically (e.g., "invoiceNumber" → "invoice_number").
                            2. Convert to correct types (dates: "YYYY-MM-DD", numbers: no currency symbols).
                            3. Set to null if value not found. Do NOT invent values.

                        Respond ONLY with valid JSON.`;

        try {
            const response = await geminiClient.models.generateContent({
                model: defaultGeminiConfig.model,
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.0,
                },
            });

            const text = response.text;
            if (!text) throw ApiErrors.emptyLlmResponse();

            const structuredData = JSON.parse(text);
            logger.info(`LLM mapped ${Object.keys(structuredData).length} fields`);

            return structuredData;
        } catch (error: any) {
            logger.error('LLM mapping failed:', error);
            throw ApiErrors.llmMappingFailed(error.message);
        }
    }
}

const llmMappingService = new LlmMappingService();

export default llmMappingService;