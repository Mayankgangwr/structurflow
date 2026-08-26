import { useState } from "react";
import { useUploadDocumentMutation } from "../documentApi";

export const useUploadDocument = (projectId: string) => {
    const [uploadDocument, { isLoading, isError, error }] = useUploadDocumentMutation();
    const [uploadError, setUploadError] = useState<string | null>(null);

    const uploadFiles = async (files: File[]) => {
        setUploadError(null);

        try {
            // Execute the mutation and unwrap the result to catch errors properly
            const response = await uploadDocument({ projectId, files }).unwrap();

            return response;
        } catch (err: any) {
            // Extract a user-friendly error message from the API error response
            const errorMessage = err?.data?.details?.[0]?.message
                || err?.data?.message
                || err?.message
                || "Failed to upload document";

            setUploadError(errorMessage);
            throw err;
        }
    };

    return {
        uploadFiles,
        isLoading,
        isError: isError || uploadError !== null,
        error: uploadError || error,
    };

}