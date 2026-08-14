import { baseApi } from "@/services/baseApi";
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import authReducer from '@/features/auth/authSlice';

export const store = configureStore({
    reducer: {
        // Add RTK Query reducer
        [baseApi.reducerPath]: baseApi.reducer,
        auth: authReducer,
        // We will add other reducers here ( like auth, ui ) in Phase 2
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;