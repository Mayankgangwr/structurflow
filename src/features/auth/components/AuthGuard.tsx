'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { data: session, isPending, error } = authClient.useSession();
    const router = useRouter();

    useEffect(() => {
        if (!isPending && !session) {
            router.push('/login');
        }
    }, [isPending, session, router]);

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (session) {
        return <>{children}</>;
    }

    return null;
}
