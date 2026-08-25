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
        getDocuments: builder.query<{ success: boolean; data: Document[] }, { orgId: string; page?: number }>({
            query: ({ orgId, page = 1 }) => ({
                url: '/documents',
                method: 'GET',
                headers: { 'X-Organization-Id': orgId },
                params: { page },
            }),
            providesTags: ['Documents'],
        }),

        getDocumentById: builder.query<{ success: boolean; data: DocumentDetailResponse }, { orgId: string; docId: string }>({
            query: ({ orgId, docId }) => ({
                url: `/documents/${docId}`,
                method: 'GET',
                headers: { 'X-Organization-Id': orgId },
            }),
            providesTags: (result, error, arg) => [{ type: 'Documents', id: arg.docId }],
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
    useGetDocumentByIdQuery,
    useUploadDocumentMutation
} = documentApi;