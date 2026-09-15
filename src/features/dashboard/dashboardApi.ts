import { baseApi } from "@/services/baseApi";
import type {
    DashboardQueryInput,
    DashboardDataResponse,
} from "@/lib/validations/dashboard";

export const dashboardApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getDashboard: builder.query<
            { success: boolean; data: DashboardDataResponse; message: string },
            DashboardQueryInput | void
        >({
            query: (params) => ({
                url: "/dashboard",
                method: "GET",
                params: params || { period: "7d" },
            }),
            providesTags: ["Dashboard", "Analytics", "Documents", "Projects", "Activities"],
        }),
    }),
});

export const { useGetDashboardQuery, useLazyGetDashboardQuery } = dashboardApi;
