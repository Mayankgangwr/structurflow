import { useState } from "react";
import { useUploadTemplateMutation } from "../templateApi";

export const useUploadTemplate = (projectId: string) => {
    const [uploadTemplateMutation, { isLoading, isError, error }] = useUploadTemplateMutation();
    const [uploadError, setUploadError] = useState<string | null>(null);

    const uploadFile = async (file: File) => {
        setUploadError(null);
        
        try {
            // Build the multipart/form-data payload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('projectId', projectId);

            // Execute the mutation and unwrap the result to catch errors properly
            const response = await uploadTemplateMutation(formData).unwrap();
            
            return response;
        } catch (err: any) {
            // Extract a user-friendly error message from the API error response
            const errorMessage = err?.data?.details?.[0]?.message 
                || err?.data?.message 
                || err?.message 
                || "Failed to upload template";
                
            setUploadError(errorMessage);
            throw err;
        }
    };

    return {
        uploadFile,
        isLoading,
        isError: isError || uploadError !== null,
        error: uploadError || error,
    };
};
