'use client';

import { useEffect, useState } from 'react';
import { DocumentDto } from '../types/backend';

interface FileViewerProps {
  documentId: string;
}

export default function FileViewer({ documentId }: FileViewerProps) {
  const [document, setDocument] = useState<DocumentDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'summary' | 'markdown'>('summary');

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

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="rounded-lg bg-white p-8 dark:bg-gray-800">
          <p className="text-red-500">Document not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-200px)] flex-col overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-900 md:flex-row">
      {/* Left side - File Preview */}
      <div className="hidden w-1/2 flex-col border-r border-gray-200 dark:border-gray-700 md:flex">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Preview</h2>
            </div>
            <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-800">
              {document.previewUrl ? (
                <iframe
                  src={document.previewUrl}
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
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
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
  );
}