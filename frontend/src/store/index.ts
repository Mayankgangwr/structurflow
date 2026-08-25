import { baseApi } from "@/services/baseApi";
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer from '@/features/auth/authSlice';

export const makeStore = () => {
    return configureStore({
        reducer: {
            // Add RTK Query reducer
            [baseApi.reducerPath]: baseApi.reducer,
            auth: authReducer,
            // We will add other reducers here ( like auth, ui ) in Phase 2
        },
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware().concat(baseApi.middleware),
    });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];