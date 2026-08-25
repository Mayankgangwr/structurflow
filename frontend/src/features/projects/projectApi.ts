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
}

export const projectApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getProjects: builder.query<{ success: boolean; data: Project[] }, void>({
            query: () => ({
                url: '/projects',
            }),
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