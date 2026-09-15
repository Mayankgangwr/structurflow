import { baseApi } from "@/services/baseApi";
import type {
    UpdateProfileInput,
    ChangePasswordInput,
    UpdateOrganizationInput,
    SystemThresholdsInput,
} from "@/lib/validations/settings";

export interface UserProfileResponse {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    image: string | null;
    accountType: string;
    createdAt: string;
}

export interface OrganizationSettingsResponse {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    createdAt: string;
    memberCount: number;
    metadata: Record<string, any>;
}

export interface SystemSettingsResponse {
    thresholds: SystemThresholdsInput;
    infrastructure: {
        storage: {
            name: string;
            status: string;
            bucket: string;
            region?: string;
        };
        database: {
            name: string;
            status: string;
            ssl?: boolean;
        };
        aiEngine: {
            name: string;
            status: string;
            latencyMs?: number;
        };
    };
}

export const settingsApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getProfile: builder.query<{ success: boolean; data: UserProfileResponse }, void>({
            query: () => ({
                url: "/settings/profile",
                method: "GET",
            }),
            providesTags: ["Settings"],
        }),

        updateProfile: builder.mutation<
            { success: boolean; data: UserProfileResponse; message: string },
            UpdateProfileInput
        >({
            query: (body) => ({
                url: "/settings/profile",
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Settings"],
        }),

        changePassword: builder.mutation<
            { success: boolean; message: string },
            ChangePasswordInput
        >({
            query: (body) => ({
                url: "/settings/change-password",
                method: "POST",
                body,
            }),
        }),

        getOrganizationSettings: builder.query<
            { success: boolean; data: OrganizationSettingsResponse },
            void
        >({
            query: () => ({
                url: "/settings/organization",
                method: "GET",
            }),
            providesTags: ["Settings"],
        }),

        updateOrganizationSettings: builder.mutation<
            { success: boolean; data: OrganizationSettingsResponse; message: string },
            UpdateOrganizationInput
        >({
            query: (body) => ({
                url: "/settings/organization",
                method: "PATCH",
                body,
            }),
            invalidatesTags: ["Settings"],
        }),

        getSystemSettings: builder.query<
            { success: boolean; data: SystemSettingsResponse },
            void
        >({
            query: () => ({
                url: "/settings/system",
                method: "GET",
            }),
            providesTags: ["Settings"],
        }),

        updateSystemSettings: builder.mutation<
            { success: boolean; data: SystemSettingsResponse; message: string },
            SystemThresholdsInput
        >({
            query: (body) => ({
                url: "/settings/system",
                method: "PUT",
                body,
            }),
            invalidatesTags: ["Settings"],
        }),
    }),
});

export const {
    useGetProfileQuery,
    useUpdateProfileMutation,
    useChangePasswordMutation,
    useGetOrganizationSettingsQuery,
    useUpdateOrganizationSettingsMutation,
    useGetSystemSettingsQuery,
    useUpdateSystemSettingsMutation,
} = settingsApi;
