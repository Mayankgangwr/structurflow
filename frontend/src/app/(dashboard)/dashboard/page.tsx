'use client';

import { FileUploadArea } from '@/features/documents/components/FileUploadArea';
import { DocumentList } from '@/features/documents/components/DocumentList';
import { Layers } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';

const DashboardPage = () => {
    const activeOrganizationId = useAppSelector((state) => state.auth.activeOrganizationId);

    if (!activeOrganizationId) return null;

    return (
        <div className="space-y-8">
            {/* Header section */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Documents
                </h1>
                <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                    Upload and manage invoices, receipts, and forms for your organization.
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Content: Document List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        <Layers className="h-5 w-5 text-indigo-500" />
                        <h3>Recent Documents</h3>
                    </div>
                    <DocumentList orgId={activeOrganizationId} />
                </div>

                {/* Sidebar: Upload Area */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        <h3>Upload New</h3>
                    </div>
                    <FileUploadArea orgId={activeOrganizationId} />
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;