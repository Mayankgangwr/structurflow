import { baseApi } from "@/services/baseApi";

export interface Template {
    _id: string;
    organizationId: string;
    projectId: string;
    uploadedById: string;
    documentType: "TEMPLATE";
    originalFileName: string;
    mimeType: string;
    sizeBytes: number;
    fileHash: string;
    publicId: string;
    secureUrl: string;
    status: string;
    createdAt: string;
    updatedAt: string;
}

export const templateApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Upload a new template
        uploadTemplate: builder.mutation<{ success: boolean; data: { document: Template, warnings: string[] } }, FormData>({
            query: (formData) => ({
                url: '/templates',
                method: 'POST',
                body: formData,
            }),
            invalidatesTags: ['Templates', 'Projects']
        }),

        // Upload a new template
        proccessTemplate: builder.mutation<{ success: boolean; data: { template: Template, warnings: string[] } }, string>({
            query: (templateId) => ({
                url: '/templates/proccess',
                method: 'PUT',
                body: { templateId },
            }),
            invalidatesTags: ['Templates', 'Projects']
        }),

        // Get all templates for a project
        getProjectTemplates: builder.query<{ success: boolean; data: Template[] }, string>({
            query: (projectId) => ({
                url: `/templates/project/${projectId}`,
                method: 'GET'
            }),
            providesTags: (result, error, projectId) => [{ type: 'Templates', id: projectId }]
        }),

        // Get all templates for the current organization
        getOrgTemplates: builder.query<{ success: boolean; data: Template[] }, void>({
            query: () => ({
                url: '/templates',
                method: 'GET'
            }),
            providesTags: ['Templates']
        }),

        // Get the currently active template for a project
        getActiveProjectTemplate: builder.query<{ success: boolean; data: Template | null }, string>({
            query: (projectId) => ({
                url: `/templates/project/${projectId}/active`,
                method: 'GET'
            }),
            providesTags: (result, error, projectId) => [{ type: 'Templates', id: `${projectId}-active` }]
        }),

        // Get a specific template by ID
        getTemplateById: builder.query<{ success: boolean; data: { document: Template, auditTrail: any[] } }, string>({
            query: (id) => ({
                url: `/templates/${id}`,
                method: 'GET'
            }),
            providesTags: (result, error, id) => [{ type: 'Templates', id }]
        }),

        // Set a template as active for its project
        setActiveTemplate: builder.mutation<{ success: boolean }, { id: string, projectId: string }>({
            query: ({ id, projectId }) => ({
                url: `/templates/${id}/active`,
                method: 'PUT',
                body: { projectId }
            }),
            invalidatesTags: (result, error, { projectId }) => [
                { type: 'Templates', id: `${projectId}-active` },
                { type: 'Projects', id: projectId }
            ]
        }),

        // Delete a template
        deleteTemplate: builder.mutation<{ success: boolean }, string>({
            query: (id) => ({
                url: `/templates/${id}`,
                method: 'DELETE'
            }),
            invalidatesTags: ['Templates', 'Projects']
        })
    })
});

export const {
    useUploadTemplateMutation,
    useProccessTemplateMutation,
    useGetProjectTemplatesQuery,
    useGetOrgTemplatesQuery,
    useGetActiveProjectTemplateQuery,
    useGetTemplateByIdQuery,
    useSetActiveTemplateMutation,
    useDeleteTemplateMutation
} = templateApi;