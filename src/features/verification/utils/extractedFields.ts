/**
 * Utility functions for normalizing, parsing, and formatting
 * AI-extracted document fields in StructurFlow.
 *
 * Handles multiple formats seamlessly:
 * 1. Array of field schema objects:
 *    [{ fieldName: "offer_date", label: "Offer Date", originalValue: "2026-08-31", value: "...", required: true, type: "date" }]
 * 2. Wrapped object formats:
 *    { data: [...] }, { fields: [...] }, { extractedFields: [...] }
 * 3. Flat key-value dictionaries:
 *    { offer_number: "SF-102", candidate_name: "Rahul Sharma" }
 * 4. Mixed nested values and primitive arrays
 */

export interface ExtractedFieldItem {
    id: string;
    key: string;
    label: string;
    value: string;
    rawValue: any;
    hasValue: boolean;
    type?: string;
    required?: boolean;
    confidence?: number;
    placeholder?: string;
    description?: string;
}

/**
 * Converts a raw field key/name (e.g. "offer_letter_number", "candidateId", "{{date_of_birth}}")
 * into a clean, human-readable Title Case label.
 */
export function formatFieldLabel(rawKey: string): string {
    if (!rawKey || typeof rawKey !== "string") return "Field";

    // Strip placeholder braces: {{field_name}} -> field_name
    let cleaned = rawKey.replace(/^\{\{|\}\}$/g, "").trim();

    // Replace underscores, hyphens, and dots with spaces
    cleaned = cleaned.replace(/[-_.]+/g, " ");

    // Separate camelCase words: candidateName -> candidate Name
    cleaned = cleaned.replace(/([a-z0-9])([A-Z])/g, "$1 $2");

    // Known uppercase acronyms
    const acronyms = new Set([
        "ID",
        "PDF",
        "USD",
        "EUR",
        "GBP",
        "INR",
        "URL",
        "HR",
        "API",
        "AI",
        "SSN",
        "DOB",
        "VAT",
        "GST",
        "PAN",
        "LLC",
        "INC",
        "HQ",
        "SKU",
        "ZIP",
    ]);

    return cleaned
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => {
            const upper = word.toUpperCase();
            if (acronyms.has(upper)) return upper;
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(" ");
}

/**
 * Normalizes raw AI extraction payload into an array of structured ExtractedFieldItem objects.
 */
export function normalizeExtractedFields(input: any): ExtractedFieldItem[] {
    if (!input) return [];

    // 1. Handle wrapped object: { data: [...] }, { fields: [...] }, { extractedFields: [...] }
    if (typeof input === "object" && !Array.isArray(input)) {
        if (Array.isArray(input.data)) {
            return normalizeExtractedFields(input.data);
        }
        if (Array.isArray(input.fields)) {
            return normalizeExtractedFields(input.fields);
        }
        if (Array.isArray(input.extractedFields)) {
            return normalizeExtractedFields(input.extractedFields);
        }
    }

    // 2. Handle array of items
    if (Array.isArray(input)) {
        return input.map((item, index) => {
            // Case A: primitive element (string, number, boolean)
            if (typeof item !== "object" || item === null) {
                const valStr = String(item ?? "");
                return {
                    id: `field_${index}`,
                    key: `field_${index}`,
                    label: `Field ${index + 1}`,
                    value: valStr,
                    rawValue: item,
                    hasValue: valStr.trim().length > 0,
                };
            }

            // Case B: standard schema object
            const key =
                item.fieldName ||
                item.name ||
                item.key ||
                item.field ||
                (item.placeholder ? item.placeholder.replace(/^\{\{|\}\}$/g, "").trim() : "") ||
                `field_${index}`;

            const label = item.label || formatFieldLabel(key);

            // Extract value: prioritize edited value, then originalValue, then val/text
            let rawVal =
                item.value !== undefined && item.value !== null
                    ? item.value
                    : item.originalValue !== undefined && item.originalValue !== null
                    ? item.originalValue
                    : item.val !== undefined && item.val !== null
                    ? item.val
                    : item.text !== undefined && item.text !== null
                    ? item.text
                    : "";

            let displayVal = "";
            let hasValue = false;

            if (rawVal !== undefined && rawVal !== null) {
                if (typeof rawVal === "object") {
                    displayVal = JSON.stringify(rawVal);
                    hasValue = Object.keys(rawVal).length > 0;
                } else {
                    displayVal = String(rawVal);
                    hasValue = displayVal.trim().length > 0;
                }
            }

            return {
                id: key || `field_${index}`,
                key,
                label,
                value: displayVal,
                rawValue: rawVal,
                hasValue,
                type: item.type,
                required: Boolean(item.required),
                confidence: typeof item.confidence === "number" ? item.confidence : undefined,
                placeholder: item.placeholder,
                description: item.description,
            };
        });
    }

    // 3. Handle flat dictionary: { key: "value", ... }
    if (typeof input === "object") {
        return Object.entries(input).map(([key, rawVal], index) => {
            let displayVal = "";
            let hasValue = false;

            if (rawVal !== undefined && rawVal !== null) {
                if (typeof rawVal === "object") {
                    if ("value" in rawVal || "originalValue" in rawVal) {
                        const innerVal = (rawVal as any).value ?? (rawVal as any).originalValue;
                        displayVal = String(innerVal ?? "");
                        hasValue = displayVal.trim().length > 0;
                    } else {
                        displayVal = JSON.stringify(rawVal);
                        hasValue = Object.keys(rawVal).length > 0;
                    }
                } else {
                    displayVal = String(rawVal);
                    hasValue = displayVal.trim().length > 0;
                }
            }

            return {
                id: key || `field_${index}`,
                key,
                label: formatFieldLabel(key),
                value: displayVal,
                rawValue: rawVal,
                hasValue,
            };
        });
    }

    return [];
}

/**
 * Returns prioritized preview fields for compact card views.
 * Ensures fields that have actual extracted values are prioritized over empty ones.
 */
export function getPreviewFields(
    fields: ExtractedFieldItem[],
    limit: number = 2
): ExtractedFieldItem[] {
    if (!fields || fields.length === 0) return [];

    // First pick fields that have actual values
    const withValues = fields.filter((f) => f.hasValue);
    if (withValues.length >= limit) {
        return withValues.slice(0, limit);
    }

    // Fill remaining slots with fields even if empty
    const remaining = fields.filter((f) => !f.hasValue);
    return [...withValues, ...remaining].slice(0, limit);
}
