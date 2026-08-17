'use client';

import React, { use } from 'react';
import { useGetDocumentByIdQuery } from '@/features/documents/documentApi';
import { useAppSelector } from '@/store/hooks';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format } from 'date-fns';
import { ArrowLeft, FileText, Loader2, History } from 'lucide-react';
import Link from 'next/link';

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // In Next.js 15, params is a promise
  const resolvedParams = use(params);
  const documentId = resolvedParams.id;
  const activeOrganizationId = useAppSelector((state) => state.auth.activeOrganizationId);

  const { data, isLoading, isError } = useGetDocumentByIdQuery(
    { orgId: activeOrganizationId!, docId: documentId },
    { skip: !activeOrganizationId }
  );

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isError || !data?.data?.document) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Document not found</h2>
        <p className="mt-2 text-zinc-500">The document you're looking for doesn't exist or you don't have access.</p>
        <Link href="/dashboard" className="mt-4 inline-flex items-center text-indigo-600 hover:underline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  const { document, auditTrail } = data.data;

  const isImage = document.mimeType.includes('image');
  const isPDF = document.mimeType === 'application/pdf';

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="p-2 hover:bg-zinc-100 rounded-full dark:hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="h-5 w-5 text-zinc-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <FileText className="h-6 w-6 text-indigo-500" />
              {document.originalFileName || document.originalFilename}
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Uploaded {formatDistanceToNow(new Date(document.createdAt), { addSuffix: true })}
            </p>
          </div>
        </div>
        <div>
          <Badge variant={document.status === 'UPLOADED' ? 'info' : 'default'} className="text-sm px-4 py-1">
            {document.status}
          </Badge>
        </div>
      </div>

      {/* Main Content Split */}
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Left: Document Viewer */}
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 flex flex-col">
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">Document Preview</h3>
          </div>
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            {isPDF ? (
              <iframe
                src={`${document.secureUrl}#view=FitH`}
                className="w-full h-full rounded-lg border border-zinc-200 dark:border-zinc-800"
                title={document.originalFileName || document.originalFilename}
              />
            ) : isImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={document.secureUrl}
                alt={document.originalFileName || document.originalFilename}
                className="max-h-full max-w-full object-contain rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm"
              />
            ) : (
              <div className="text-zinc-500 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-zinc-300 dark:text-zinc-700" />
                <p>Preview not available for this file type.</p>
                <a href={document.secureUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline mt-2 inline-block">
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right: Sidebar (Details & Audit) */}
        <div className="flex flex-col space-y-6 overflow-y-auto pr-2 pb-6">
          {/* Details Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-4 border-b border-zinc-100 pb-2 dark:border-zinc-800">
              Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">File Type</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{document.mimeType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">File Size</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {Math.round(document.sizeBytes / 1024)} KB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">Uploaded On</span>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {format(new Date(document.createdAt), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Trail Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 flex-1">
            <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 pb-2 dark:border-zinc-800">
              <History className="h-5 w-5 text-indigo-500" />
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Audit History</h3>
            </div>
            
            {auditTrail && auditTrail.length > 0 ? (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                 {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                 {auditTrail.map((log: any, index: number) => (
                    <div key={log._id || index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full border border-white bg-indigo-500 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2"></div>
                      <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-sm text-slate-900">{log.action.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-xs text-slate-500">{format(new Date(log.createdAt), 'MMM d, h:mm a')}</p>
                      </div>
                    </div>
                 ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 italic">No audit history found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
