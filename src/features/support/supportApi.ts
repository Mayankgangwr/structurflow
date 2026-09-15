import { baseApi } from "@/services/baseApi";
import type {
    CreateSupportTicketInput,
    SupportTicketResponse,
    SystemHealthResponse,
} from "@/lib/validations/support";

export const supportApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getSystemHealth: builder.query<
            { success: boolean; data: SystemHealthResponse },
            void
        >({
            query: () => ({
                url: "/support/health",
                method: "GET",
            }),
            providesTags: ["Support"],
        }),

        createSupportTicket: builder.mutation<
            { success: boolean; message: string; data: SupportTicketResponse },
            CreateSupportTicketInput
        >({
            query: (body) => ({
                url: "/support/ticket",
                method: "POST",
                body,
            }),
            invalidatesTags: ["Support", "Activities"],
        }),
    }),
});

export const {
    useGetSystemHealthQuery,
    useCreateSupportTicketMutation,
} = supportApi;
