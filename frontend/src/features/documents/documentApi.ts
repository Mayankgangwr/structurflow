import { baseApi } from "@/services/baseApi";

export interface Document {
    _id: string;
    originalFilename: string;
    originalFileName?: string; // from mongoose
    mimeType: string;
    secureUrl: string;
    sizeBytes: number;
    status: 'UPLOADED' | 'PROCESSING' | 'REVIEW_REQUIRED' | 'TRUSTED' | 'REJECTED' | 'FAILED';
    createdAt: string;
}

export interface DocumentDetailResponse {
    document: Document;
    auditTrail: any[];
    downloadUrl: string;
}

export const documentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getDocuments: builder.query<{ success: boolean; data: Document[] }, { projectId: string, page?: number, limit?: number }>({
            query: ({ projectId, page = 1, limit = 10 }) => ({
                url: `/documents/${projectId}?page=${page}&limit=${limit}`,
                method: 'GET',
            }),
            providesTags: ['Documents'],
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

        uploadDocument: builder.mutation<{ success: boolean; data: { document: Document; warnings: string[] } },
            { orgId: string; projectId: string; documentType: 'TEMPLATE' | 'RAW'; file: File }>({
                query: ({ orgId, projectId, documentType, file }) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('projectId', projectId);
                    formData.append('documentType', documentType);
                    return {
                        url: '/documents',
                        method: 'POST',
                        headers: { 'X-Organization-Id': orgId },
                        body: formData,
                    };
                },
                invalidatesTags: ['Documents', 'Projects'], // Refreshes both lists
            }),
    }),
});

export const {
    useGetDocumentsQuery,
    useGetDocumentsSummaryQuery,
    useGetDocumentByIdQuery,
    useUploadDocumentMutation
} = documentApi;