// frontend/src/features/projects/projectApi.ts
import { baseApi } from "@/services/baseApi";

export interface Project {
    id: string;
    name: string;
    description: string;
    status: "Active" | "Inactive";
    documents: number;
    processing: number;
    needsVerification: number;
    successRate: number;
    lastActivity: string;
    activeTemplateId?: string | null;
    templateData?: any | null;
}

export interface GetProjectsParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface ProjectsPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ProjectsMeta {
    totalProjects: number;
    totalPendingVerification: number;
}

export interface ProjectsResponseData {
    projects: Project[];
    pagination: ProjectsPagination;
    meta: ProjectsMeta;
}

export const projectApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getProjects: builder.query<{ success: boolean; data: ProjectsResponseData }, GetProjectsParams | void>({
            query: (params) => {
                const searchParams = new URLSearchParams();
                if (params?.page) searchParams.set("page", String(params.page));
                if (params?.limit) searchParams.set("limit", String(params.limit));
                if (params?.search && params.search.trim()) searchParams.set("search", params.search.trim());
                if (params?.status && params.status !== "ALL") searchParams.set("status", params.status);
                if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
                if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

                const queryString = searchParams.toString();
                return {
                    url: queryString ? `/projects?${queryString}` : '/projects',
                };
            },
            providesTags: ['Projects']
        }),

        createProject: builder.mutation<{ success: boolean; data: Project }, { name: string, description: string }>({
            query: ({ name, description }) => ({
                url: '/projects',
                method: 'POST',
                body: { name, description }
            }),
            invalidatesTags: ['Projects']
        }),

        getProjectById: builder.query<{ success: boolean; data: Project }, string>({
            query: (projectId) => ({
                url: `/projects/${projectId}`,
                method: 'GET',
            }),
            providesTags: (result, error, projectId) => [{ type: 'Projects', id: projectId }],
        }),

        updateProject: builder.mutation<{ success: boolean; data: Project }, { projectId: string; name?: string; description?: string }>(
            {
                query: ({ projectId, name, description }) => ({
                    url: `/projects/${projectId}`,
                    method: 'PATCH',
                    body: {
                        name: name,
                        description: description,
                    }
                }),
                invalidatesTags: ['Projects']
            }
        ),

        deleteProject: builder.mutation<{ success: boolean; data: Project }, string>(
            {
                query: (projectId) => ({
                    url: `/projects/${projectId}`,
                    method: 'DELETE',
                }),
                invalidatesTags: ['Projects']
            }
        ),

    })
});


export const {
    useCreateProjectMutation, useGetProjectsQuery,
    useGetProjectByIdQuery, useUpdateProjectMutation, useDeleteProjectMutation
} = projectApi;