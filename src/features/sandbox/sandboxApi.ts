import { baseApi } from "@/services/baseApi";

export interface SandboxPreset {
    id: string;
    name: string;
    category: string;
    description: string;
    fields: string[];
    sampleDocText?: string;
}

export interface SandboxTransformResponse {
    filename: string;
    pdfBase64: string;
    extractedFields: Record<string, any>;
    processingTimeMs: number;
    meta: {
        documentName: string;
        templateName: string;
        fieldCount: number;
        isPreset: boolean;
    };
}

export interface SandboxTransformArgs {
    documentFile: File;
    templateFile?: File | null;
    presetId?: string;
}

export const sandboxApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getSandboxPresets: builder.query<{ success: boolean; data: SandboxPreset[] }, void>({
            query: () => ({
                url: "/sandbox/presets",
                method: "GET",
            }),
        }),
        transformSandboxDocument: builder.mutation<
            { success: boolean; message: string; data: SandboxTransformResponse },
            FormData
        >({
            query: (formData) => ({
                url: "/sandbox/transform",
                method: "POST",
                body: formData,
            }),
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetSandboxPresetsQuery,
    useTransformSandboxDocumentMutation,
} = sandboxApi;
