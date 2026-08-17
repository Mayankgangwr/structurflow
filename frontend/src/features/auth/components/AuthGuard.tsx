'use client';

import React, { useEffect } from 'react';
import { useGetMeQuery } from '@/features/auth/authApi';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { data, isLoading, isError } = useGetMeQuery();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isError) {
            router.push('/login');
        }
    }, [isError, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // We check for success or seccess because of the typo in AuthResponse interface
    if (data?.seccess || (data as any)?.success) {
        return <>{children}</>;
    }

    return null;
}
