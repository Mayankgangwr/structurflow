import { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
    // credentials: 'include' is critical to send the secure cookies automatically
    credentials: 'include',
});

export const baseQueryWithReAuth: BaseQueryFn<
    string | FetchArgs,
    unknown,
    FetchBaseQueryError
> = async (args, api, extraOptions) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result.error && result.error.status === 401) {
        // Access token has expired, try to get a new one
        const refreshResult = await baseQuery(
            { url: '/auth/refresh', method: 'POST' },
            api,
            extraOptions
        );
        if (refreshResult.data) {
            // Refresh was successful. Retry the original query.
            result = await baseQuery(args, api, extraOptions);
        } else {
            // Refresh failed (refresh token expired/missing). Force logout.
            await baseQuery({ url: '/auth/logout', method: 'POST' }, api, extraOptions);
            api.dispatch({ type: 'auth/logoutUser' });
            window.location.href = '/login';
        }
    }
    return result;
}