import { baseApi } from "@/services/baseApi";
import { ApiResponse } from "@/types/api";
import { register } from "module";

export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}

export interface Organization {
    id: string;
    name: string;
}

export interface Membership {
    role: string;
    organizationId: string; // Matches backend's m.organizationId
}

export interface AuthResponse {
    seccess: boolean;
    data: {
        user: User;
        memberships?: Membership[];
        organization?: Organization;
        accessToken?: string;
        refreshToken?: string;
    };
}


export const authApi = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        // Login API
        login: builder.mutation<AuthResponse, any>({
            query: (credentials) => ({
                url: `/auth/login`,
                method: 'POST',
                body: credentials
            }),
        }),

        // Register API
        register: builder.mutation<AuthResponse, any>({
            query: (userData) => ({
                url: `/auth/register`,
                method: 'POST',
                body: userData
            }),
        }),

        // Verify OTP API
        verifyOTP: builder.mutation<AuthResponse, any>({
            query: (otpData) => ({
                url: `/auth/verify-otp`,
                method: 'POST',
                body: otpData
            }),
        }),

        // Resend OTP API
        resendOTP: builder.mutation<AuthResponse, any>({
            query: (data) => ({
                url: `/auth/resend-otp`,
                method: 'POST',
                body: data
            }),
        }),

        // Logout API
        logout: builder.mutation<AuthResponse, any>({
            query: () => ({
                url: '/auth/logout',
                method: 'POST',
            }),
        }),

        // Get Current 
        getMe: builder.query<AuthResponse, void>({
            query: () => '/auth/me',
        }),

        // Forgot Password API
        forgotPassword: builder.mutation<ApiResponse<null>, { email: string }>({
            query: (credentials) => ({
                url: '/auth/forgot-password',
                method: 'POST',
                body: credentials,
            })
        }),

        // Reset Password API
        resetPassword: builder.mutation<ApiResponse<null>, any>({
            query: (credentials) => ({
                url: '/auth/reset-password',
                method: 'POST',
                body: credentials,
            }),
        }),

        // Accept Invite API
        acceptInvite: builder.mutation<AuthResponse, any>({
            query: (credentials) => ({
                url: '/auth/accept-invite',
                method: 'POST',
                body: credentials,
            }),
        }),
    }),
});

export const {
    useLoginMutation, useRegisterMutation, useLogoutMutation,
    useGetMeQuery, useVerifyOTPMutation, useResendOTPMutation,
    useForgotPasswordMutation, useResetPasswordMutation, useAcceptInviteMutation
} = authApi;