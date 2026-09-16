import { GoogleGenAI } from "@google/genai";
import type { TemplateField, TemplateFieldType, TemplateSchemaDefinition } from "@/schema/template-schema";

const apiKey = process.env.GEMINI_API_KEY;
export const gemini = new GoogleGenAI({ apiKey: apiKey || "" });
export { aiService } from "./services/ai.service";
const models = ["gemini-3.1-pro", "gemini-3.8-flash"];

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" })[character] ?? character);
const normalizeFieldName = (value: unknown) => String(value ?? "").replace(/^\{\{|\}\}$/g, "").replace(/[^a-zA-Z0-9_]/g, "_").replace(/^_+|_+$/g, "").toLowerCase();

async function generateJson(prompt: string, fileBuffer: Buffer, mimeType: string) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");
    let lastError: Error | null = null;

    for (const model of models) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: fileBuffer.toString("base64") } }] }],
                    generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
                }),
            });
            if (!response.ok) throw new Error(`${model} returned HTTP ${response.status}.`);
            const payload: unknown = await response.json();
            const text = isRecord(payload)
                ? (payload.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined)?.[0]?.content?.parts?.[0]?.text
                : undefined;
            if (!text) throw new Error(`${model} returned an empty response.`);
            return JSON.parse(text) as unknown;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error("Gemini request failed.");
        }
    }
    throw lastError ?? new Error("Gemini request failed.");
}

function fallbackTemplate(fileName: string): { schema: TemplateSchemaDefinition; htmlContent: string; pageCount: number } {
    return {
        schema: { version: 1, fields: [] },
        htmlContent: `<div style="font-family:Arial,sans-serif;padding:24px"><h2>${escapeHtml(fileName)}</h2><p>Template uploaded and ready for processing.</p></div>`,
        pageCount: 1,
    };
}

function parseTemplateFields(value: unknown): TemplateField[] {
    if (!Array.isArray(value)) return [];
    const fieldTypes: TemplateFieldType[] = ["string", "number", "date", "boolean", "currency"];
    return value.flatMap((rawField) => {
        if (!isRecord(rawField)) return [];
        const fieldName = normalizeFieldName(rawField.fieldName ?? rawField.name);
        if (!fieldName) return [];
        const type = fieldTypes.includes(rawField.type as TemplateFieldType) ? rawField.type as TemplateFieldType : "string";
        return [{
            fieldName,
            label: String(rawField.label ?? fieldName.replace(/_/g, " ")),
            type,
            required: Boolean(rawField.required),
            placeholder: `{{${fieldName}}}`,
            originalValue: rawField.originalValue == null ? undefined : String(rawField.originalValue),
            description: rawField.description == null ? undefined : String(rawField.description),
        }];
    });
}

export async function extractTemplateSchemaAndHtml(fileBuffer: Buffer, mimeType: string, fileName: string): Promise<{ schema: TemplateSchemaDefinition; htmlContent: string; pageCount: number }> {
    const fallback = fallbackTemplate(fileName);
    try {
        const result = await generateJson(
            "Analyze this document template. Return JSON only: { pageCount: number, schema: { version: 1, fields: [{ fieldName, label, type, required, originalValue, description }] }, html: string }. Identify dynamic values as snake_case Handlebars fields. Return safe semantic HTML with placeholders.",
            fileBuffer,
            mimeType,
        );
        if (!isRecord(result)) return fallback;
        const schemaData = isRecord(result.schema) ? result.schema : result;
        const fields = parseTemplateFields(schemaData.fields);
        return {
            schema: { version: 1, fields },
            htmlContent: typeof result.html === "string" && result.html.trim() ? result.html : fallback.htmlContent,
            pageCount: typeof result.pageCount === "number" && result.pageCount > 0 ? result.pageCount : 1,
        };
    } catch (error) {
        console.warn("[Gemini template analysis]", error instanceof Error ? error.message : error);
        return fallback;
    }
}

export async function extractDocumentDataAgainstSchema(fileBuffer: Buffer, mimeType: string, fileName: string, schema: unknown) {
    const fields = isRecord(schema) ? parseTemplateFields(schema.fields) : [];
    if (fields.length === 0) return { extractedFields: [], confidenceScore: 0, rawJson: {} };
    try {
        const result = await generateJson(
            `Extract values from "${fileName}" for these fields: ${JSON.stringify(fields.map((field) => ({ fieldName: field.fieldName, label: field.label, type: field.type })))}. Return JSON only: { values: { field_name: value }, confidenceScore: number }.`,
            fileBuffer,
            mimeType,
        );
        const values = isRecord(result) && isRecord(result.values) ? result.values : {};
        const extractedFields = fields.map((field) => ({ fieldName: field.fieldName, value: values[field.fieldName] ?? null, confidence: 0.9 }));
        const confidenceScore = isRecord(result) && typeof result.confidenceScore === "number" ? Math.max(0, Math.min(1, result.confidenceScore)) : 0.9;
        return { extractedFields, confidenceScore, rawJson: values };
    } catch {
        return { extractedFields: [], confidenceScore: 0, rawJson: {} };
    }
}

