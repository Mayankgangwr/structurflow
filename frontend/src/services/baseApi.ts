import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReAuth } from "@/store/baseQuery";

export const baseApi = createApi({
    reducerPath: 'baseApi',
    baseQuery: baseQueryWithReAuth,
    /**
     *  We will define tag types here later for cache invalidation (e.g. 'Documents')
     * */
    tagTypes: [],
    endpoints: () => ({}),
});