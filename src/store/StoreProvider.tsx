'use client';

import React, { useRef, useEffect } from 'react';
import { Provider } from 'react-redux';
import { setupListeners } from '@reduxjs/toolkit/query';
import { AppStore, makeStore } from '@/store';

export interface IStoreProviderProps {
    children: React.ReactNode;
}

const StoreProvider: React.FC<IStoreProviderProps> = ({ children }) => {
    const storeRef = useRef<AppStore | null>(null);

    if (!storeRef.current) {
        // Create the store instance the first time this renders
        storeRef.current = makeStore();
    }

    useEffect(() => {
        if (storeRef.current != null) {
            // Enable RTK Query refetchOnFocus/refetchOnReconnect behaviors
            const unsubscribe = setupListeners(storeRef.current.dispatch);
            return unsubscribe;
        }
    }, []);

    return <Provider store={storeRef.current}>{children}</Provider>;
}

export default StoreProvider;

