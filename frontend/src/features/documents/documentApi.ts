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

export interface GetDocumentsParams {
    projectId: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: 'createdAt' | 'name' | 'size' | 'status';
    sortOrder?: 'asc' | 'desc';
}

export interface GetAllDocumentsParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    projectId?: string;
    sortBy?: 'createdAt' | 'name' | 'size' | 'status';
    sortOrder?: 'asc' | 'desc';
}

export interface DocumentsResponseData {
    documents: Document[];
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
}

export interface OrganizationDocumentsResponseData {
    documents: (Document & { projectId?: { _id: string; name: string } | string })[];
    total: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    stats?: {
        total: number;
        uploaded: number;
        processing: number;
        transformed: number;
        verified: number;
        needsVerification: number;
        exported: number;
        failed: number;
    };
}

export const documentApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAllDocuments: builder.query<{ success: boolean; data: OrganizationDocumentsResponseData }, GetAllDocumentsParams | void>({
            query: (params) => {
                const queryParams = new URLSearchParams();
                if (params) {
                    if (params.page) queryParams.append('page', params.page.toString());
                    if (params.limit) queryParams.append('limit', params.limit.toString());
                    if (params.search && params.search.trim()) queryParams.append('search', params.search.trim());
                    if (params.status && params.status !== 'ALL') queryParams.append('status', params.status);
                    if (params.projectId && params.projectId !== 'ALL') queryParams.append('projectId', params.projectId);
                    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
                    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
                }

                const queryString = queryParams.toString();
                return {
                    url: `/documents${queryString ? `?${queryString}` : ''}`,
                    method: 'GET',
                };
            },
            providesTags: ['Documents'],
        }),

        getDocuments: builder.query<{ success: boolean; data: DocumentsResponseData }, GetDocumentsParams>({
            query: ({ projectId, page = 1, limit = 10, search, status, sortBy, sortOrder }) => {
                const params = new URLSearchParams();
                params.append('page', page.toString());
                params.append('limit', limit.toString());
                if (search && search.trim()) params.append('search', search.trim());
                if (status && status !== 'ALL') params.append('status', status);
                if (sortBy) params.append('sortBy', sortBy);
                if (sortOrder) params.append('sortOrder', sortOrder);

                return {
                    url: `/documents/${projectId}?${params.toString()}`,
                    method: 'GET',
                };
            },
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

        bulkVerifyDocuments: builder.mutation<{ success: boolean; data: { successful: string[]; failed: any[]; total: number } }, { documentIds: string[] }>({
            query: ({ documentIds }) => ({
                url: '/documents/bulk-verify',
                method: 'POST',
                body: { documentIds },
            }),
            invalidatesTags: ['Documents'],
        }),

        rejectDocument: builder.mutation<{ success: boolean; data: any }, { documentId: string; reason?: string }>({
            query: ({ documentId, reason }) => ({
                url: `/documents/reject/${documentId}`,
                method: 'PUT',
                body: { reason },
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
    useGetAllDocumentsQuery,
    useGetDocumentsQuery,
    useGetDocumentPreviewQuery,
    useGetDocumentsSummaryQuery,
    useGetDocumentByIdQuery,
    useUploadDocumentMutation,
    useProcessDocumentMutation,
    useVerifyDocumentMutation,
    useBulkVerifyDocumentsMutation,
    useRejectDocumentMutation,
    useExportDocumentMutation,
    useDeleteDocumentMutation
} = documentApi;