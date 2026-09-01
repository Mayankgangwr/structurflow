import { GoogleGenAI } from '@google/genai';
import { config } from './env';

/**
 * Singleton instance of the Google Gen AI client.
 * Using the official @google/genai SDK.
 */
export const geminiClient = new GoogleGenAI({
    apiKey: config.GEMINI_API_KEY
});

// Helper for default configuration
export const defaultGeminiConfig = {
    // Reverted to gemini-3.5-flash due to high demand on 3.7
    model: 'gemini-3.5-flash', 
};
