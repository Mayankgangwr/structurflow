import { baseApi } from "@/services/baseApi";
import { Star } from "lucide-react";

export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'REVIEW_REQUIRED' | 'TRUSTED' | 'TRANSFORMED' | 'VERIFIED' | 'REJECTED' | 'FAILED' | 'EXPORTED';

export interface Document {
    _id: string;
    originalFilename: string;
    originalFileName?: string; // from mongoose
    mimeType: string;
    secureUrl: string;
    sizeBytes: number;
    status: DocumentStatus;
    createdAt: string;
    processingDetails?: any;
}

export interface DocumentDetailResponse {
    document: Document;
    auditTrail: any[];
    downloadUrl: string;
    templateHtml?: string;
}

export const documentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getDocuments: builder.query<{ success: boolean; data: { documents: Document[], total: number } }, { projectId: string, page?: number, limit?: number }>({
            query: ({ projectId, page = 1, limit = 10 }) => ({
                url: `/documents/${projectId}?page=${page}&limit=${limit}`,
                method: 'GET',
            }),
            providesTags: ['Documents'],
        }),

        getDocumentPreview: builder.query<{ success: boolean; data: any }, string>({
            query: (documentId) => ({
                url: `/documents/transform-preview/${documentId}`,
                method: 'GET',
            }),
            providesTags: ['Documents'],
        }),

        exportDocument: builder.mutation<{ success: boolean; data: string }, string>({
            query: (documentId) => ({
                url: `/documents/export/${documentId}`,
                method: 'PUT',
                body: { status: "EXPORTED" },
            }),
            invalidatesTags: ['Documents'],
        }),

        getDocumentsSummary: builder.query<{ success: boolean; data: { TOTAL: number, UPLOADED: number, TRANSFORMED: number, VERIFIED: number, REJECTED: number, EXPORTED: number } }, { projectId: string }>({
            query: ({ projectId }) => ({
                url: `/documents/summary/${projectId}`,
                method: 'GET',
            }),
            providesTags: ['Documents'],
        }),

        getDocumentById: builder.query<{ success: boolean; data: DocumentDetailResponse }, string>({
            query: (docId) => ({
                url: `/documents/detail/${docId}`,
                method: 'GET',
            }),
            providesTags: (result, error, docId) => [
                { type: 'Documents', id: docId },
            ],
        }),

        uploadDocument: builder.mutation<{ success: boolean; data: any },
            { projectId: string; files: File[] }>({
                query: ({ projectId, files }) => {
                    const formData = new FormData();

                    // Append multiple files to the same key
                    files.forEach(file => {
                        formData.append('files', file);
                    });

                    formData.append('projectId', projectId);
                    formData.append('documentType', 'RAW');

                    return {
                        url: '/documents',
                        method: 'POST',
                        body: formData,
                    };
                },
                invalidatesTags: ['Documents'],
            }),

        verifyDocument: builder.mutation<{ success: boolean; data: any }, { documentId: string; status?: string }>({
            query: ({ documentId, status }) => ({
                url: `/documents/verify/${documentId}`,
                method: 'PUT',
                body: { status: status || "VERIFIED" },
            }),
            invalidatesTags: ['Documents'],
        }),

        processDocument: builder.mutation<{ success: boolean; data: any }, { documentId: string }>({
            query: ({ documentId }) => ({
                url: `/documents/process`,
                method: 'POST',
                body: { documentId },
            }),
            invalidatesTags: ['Documents'],
        }),

        deleteDocument: builder.mutation<{ success: boolean; data: any }, string>({
            query: (documentId) => ({
                url: `/documents/${documentId}`,
                method: 'DELETE',
            }),
            invalidatesTags: ['Documents'],
        }),
    }),
});

export const {
    useGetDocumentsQuery,
    useGetDocumentPreviewQuery,
    useGetDocumentsSummaryQuery,
    useGetDocumentByIdQuery,
    useUploadDocumentMutation,
    useProcessDocumentMutation,
    useVerifyDocumentMutation,
    useExportDocumentMutation,
    useDeleteDocumentMutation
} = documentApi;