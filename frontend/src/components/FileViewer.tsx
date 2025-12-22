'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Document {
  id: string;
  originalName: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  summary?: string;
  markdown?: string;
  createdAt: string;
  downloadUrl?: string;
}

interface FileViewerProps {
  documentId: string;
  onClose: () => void;
}

export default function FileViewer({ documentId, onClose }: FileViewerProps) {
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'preview' | 'summary' | 'markdown'>('preview');
  const router = useRouter();

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await fetch(`/api/documents/${documentId}`);
        if (!response.ok) throw new Error('Failed to fetch document');
        const data = await response.json();
        setDocument(data);
      } catch (error) {
        console.error('Error fetching document:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  const handleClose = () => {
    onClose();
    router.back();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="rounded-lg bg-white p-8 dark:bg-gray-800">
          <p className="text-red-500">Document not found</p>
          <button onClick={handleClose} className="mt-4 rounded bg-blue-500 px-4 py-2 text-white">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex h-full items-center justify-center p-4">
        <div className="relative flex h-full max-h-[90vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl dark:bg-gray-900 md:flex-row">
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-gray-200 p-2 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            aria-label="Close"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Left side - File Preview (Desktop only) */}
          <div className="hidden w-1/2 flex-col border-r border-gray-200 dark:border-gray-700 md:flex">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preview</h2>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-800">
              {document.downloadUrl ? (
                <iframe
                  src={document.downloadUrl}
                  className="h-full w-full"
                  title={document.originalName}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  No preview available
                </div>
              )}
            </div>
          </div>

          {/* Right side - Metadata and Details */}
          <div className="flex w-full flex-col md:w-1/2">
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <h1 className="pr-8 text-xl font-bold text-gray-900 dark:text-white">
                {document.originalName}
              </h1>
              <div className="mt-2 flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  document.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  document.status === 'PROCESSING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  document.status === 'QUEUED' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {document.status}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(document.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-6 py-3 text-sm font-medium transition-colors md:hidden ${
                  activeTab === 'preview'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'summary'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setActiveTab('markdown')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'markdown'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                Markdown
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'preview' && (
                <div className="md:hidden">
                  {document.downloadUrl ? (
                    <iframe
                      src={document.downloadUrl}
                      className="h-[60vh] w-full rounded border border-gray-300 dark:border-gray-600"
                      title={document.originalName}
                    />
                  ) : (
                    <div className="flex h-64 items-center justify-center text-gray-500">
                      No preview available
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'summary' && (
                <div className="prose dark:prose-invert max-w-none">
                  {document.summary ? (
                    <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {document.summary}
                    </p>
                  ) : (
                    <p className="text-gray-500">
                      {document.status === 'COMPLETED' ? 'No summary available' : 'Summary will be generated once processing is complete'}
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'markdown' && (
                <div className="prose dark:prose-invert max-w-none">
                  {document.markdown ? (
                    <pre className="whitespace-pre-wrap rounded bg-gray-100 p-4 text-sm text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                      {document.markdown}
                    </pre>
                  ) : (
                    <p className="text-gray-500">
                      {document.status === 'COMPLETED' ? 'No markdown available' : 'Markdown will be generated once processing is complete'}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer with download button */}
            {document.downloadUrl && (
              <div className="border-t border-gray-200 px-6 py-4 dark:border-gray-700">
                <a
                  href={document.downloadUrl}
                  download
                  className="inline-flex items-center gap-2 rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}