import { baseApi } from "@/services/baseApi";

export interface SandboxTransformResponse {
    filename: string;
    pdfBase64: string;
    extractedFields: Record<string, any>;
    processingTimeMs: number;
    meta: {
        documentName: string;
        templateName: string;
        fieldCount: number;
        isPreset?: boolean;
    };
}

export interface SandboxTransformArgs {
    documentFile: File;
    templateFile: File;
}

export const sandboxApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        transformSandboxDocument: builder.mutation<
            { success: boolean; message: string; data: SandboxTransformResponse },
            FormData
        >({
            query: (formData) => ({
                url: "/sandbox/transform",
                method: "POST",
                body: formData,
            }),
            invalidatesTags: ["Sandbox"],
        }),
    }),
    overrideExisting: false,
});

export const { useTransformSandboxDocumentMutation } = sandboxApi;
