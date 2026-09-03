'use client';

import React from 'react';

import { FileText, MoreVertical, FileImage } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useGetDocumentsQuery } from '@/features/documents/documentApi';
import { formatDistanceToNow } from 'date-fns';

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'UPLOADED': return <Badge variant="info">Uploaded</Badge>;
    case 'PROCESSING': return <Badge variant="warning">Processing...</Badge>;
    case 'REVIEW_REQUIRED': return <Badge variant="secondary">Review Required</Badge>;
    case 'TRUSTED': return <Badge variant="success">Trusted</Badge>;
    case 'REJECTED': return <Badge variant="destructive">Rejected</Badge>;
    case 'FAILED': return <Badge variant="destructive">Failed</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('image')) return <FileImage className="h-5 w-5 text-indigo-400" />;
  return <FileText className="h-5 w-5 text-rose-400" />;
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

interface DocumentListProps {
  projectId: string;
}

export const DocumentList = ({ projectId }: DocumentListProps) => {
  const { data, isLoading, isError } = useGetDocumentsQuery({ projectId: projectId });

  if (isLoading) return <div className="animate-pulse space-y-4">
    {[1, 2, 3].map(i => <div key={i} className="h-16 w-full rounded-xl bg-zinc-100 dark:bg-zinc-800/50"></div>)}
  </div>;

  if (isError) return <div className="text-red-500">Failed to load documents.</div>;
  if (!data?.data || data.data.total === 0) return <div className="text-zinc-500 text-center py-8">No documents uploaded yet.</div>;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900/50 dark:text-zinc-400">
            <tr>
              <th className="px-6 py-4 font-medium">Document</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Size</th>
              <th className="px-6 py-4 font-medium">Uploaded</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {data.data.map((doc) => (
              <tr key={doc._id} className="group hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      {getFileIcon(doc.mimeType)}
                    </div>
                    <div>
                      <Link href={`/dashboard/documents/${doc._id}`} className="font-medium text-zinc-900 hover:text-indigo-600 dark:text-zinc-100 dark:hover:text-indigo-400">
                        {doc.originalFilename || doc.originalFileName}
                      </Link>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">{getStatusBadge(doc.status)}</td>
                <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{formatBytes(doc.sizeBytes)}</td>
                <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                  {formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true })}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
