import { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { RootState } from '@/store';

const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
    // credentials: 'include' is critical to send the secure cookies automatically
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
        const state = getState() as RootState;
        const orgId = state.auth.activeOrganizationId;
        if (orgId) {
            headers.set('X-Organization-Id', orgId);
        }
        return headers;
    },
});

export const baseQueryWithReAuth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    const result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        // In Better-Auth, a 401 means unauthenticated or expired session
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
            api.dispatch({ type: 'auth/logoutUser' });
            window.location.href = '/login';
        }
    }
    return result;
};