import { GoogleGenAI } from "@google/genai";
import { config } from "./env";
import { logger } from "@/utils/logger";
import { ApiErrors } from "@/utils/errors";

export const gemini = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

export interface GeminiCallParams {
    model?: string;
    contents: any;
    config?: any;
    fallbackModels?: string[];
    maxRetriesPerModel?: number;
    initialBackoffMs?: number;
}

const DEFAULT_FALLBACK_MODELS = [
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
];

export function isTransientGeminiError(error: any): boolean {
    if (!error) return false;
    const errorStr = (error.message || String(error)).toLowerCase();
    const status = error.status || error.code || error?.response?.status;

    if ([429, 500, 502, 503, 504].includes(Number(status))) {
        return true;
    }

    const transientKeywords = [
        "503",
        "unavailable",
        "high demand",
        "spikes in demand",
        "try again later",
        "429",
        "resource_exhausted",
        "rate limit",
        "quota",
        "overloaded",
        "econnreset",
        "etimedout",
        "socket hang up",
        "network error",
    ];

    return transientKeywords.some((kw) => errorStr.includes(kw));
}

/**
 * Resilient wrapper around Gemini API generateContent:
 * 1. Tries primary model (config.GEMINI_MODEL or supplied model).
 * 2. On transient errors (503 High Demand, 429 Rate Limit, 500/502/504), retries with exponential backoff.
 * 3. If a model remains unavailable, automatically fails over to the next model in the fallback chain.
 * 4. Throws structured ApiErrors.serviceUnavailable if all models are unavailable.
 */
export async function callGeminiWithRetryAndFallback(params: GeminiCallParams) {
    const primaryModel = params.model || config.GEMINI_MODEL || "gemini-2.5-flash";
    const customFallbacks = params.fallbackModels || (
        config.GEMINI_FALLBACK_MODELS
            ? config.GEMINI_FALLBACK_MODELS.split(",").map((m) => m.trim())
            : DEFAULT_FALLBACK_MODELS
    );

    // Build unique model cascade with primary model first
    const modelCascade = Array.from(new Set([primaryModel, ...customFallbacks])).filter(Boolean);

    const maxRetries = params.maxRetriesPerModel ?? 2;
    const initialBackoff = params.initialBackoffMs ?? 1000;

    let lastError: any = null;

    for (let mIndex = 0; mIndex < modelCascade.length; mIndex++) {
        const currentModel = modelCascade[mIndex];

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await gemini.models.generateContent({
                    model: currentModel,
                    contents: params.contents,
                    config: params.config,
                });

                if (mIndex > 0 || attempt > 1) {
                    logger.info(
                        `[Gemini] Successfully generated content using fallback model: ${currentModel} (attempt ${attempt})`
                    );
                }

                return response;
            } catch (err: any) {
                lastError = err;
                const isTransient = isTransientGeminiError(err);
                const nextModel = modelCascade[mIndex + 1];

                logger.warn(
                    `[Gemini] Warning: Call to model "${currentModel}" failed (attempt ${attempt}/${maxRetries}): ${err.message}`
                );

                // If non-transient error (e.g. 404 model not found, invalid schema structure), don't waste time retrying this model
                if (!isTransient) {
                    logger.warn(`[Gemini] Non-transient error on "${currentModel}". Advancing to next fallback model.`);
                    break;
                }

                // If retries remain on this model, wait with exponential backoff
                if (attempt < maxRetries) {
                    const delay = initialBackoff * Math.pow(2, attempt - 1) + Math.random() * 300;
                    logger.info(`[Gemini] Retrying model "${currentModel}" in ${Math.round(delay)}ms...`);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                } else if (nextModel) {
                    logger.warn(`[Gemini] Model "${currentModel}" exhausted retries. Cascading to fallback model: "${nextModel}"`);
                }
            }
        }
    }

    // All models in the cascade failed
    logger.error(`[Gemini] All models in fallback cascade failed:`, lastError);

    if (isTransientGeminiError(lastError)) {
        throw ApiErrors.serviceUnavailable(
            "The AI processing service is currently experiencing high demand from Google. Please retry in a few moments."
        );
    }

    throw lastError;
}
