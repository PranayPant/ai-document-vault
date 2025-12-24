'use client';

import { useRouter } from 'next/navigation';
import FileResourceItem from '@/src/components/FileResourceItem';
import FileViewer from '@/src/components/FileViewer';
import type { FileResource } from '@/src/types/FileResource';
import { Breadcrumb, DocumentDto } from '@/src/types/backend';
import Dropzone from '@/src/components/Dropzone';

interface FileMetadataListProps {
  items: FileResource[];
  slug?: string[];
  isDocument: boolean;
  breadcrumbs?:Breadcrumb[];
  documentData?: DocumentDto
}

export default function DynamicDashboardContent({ 
  items, 
  slug, 
  isDocument, 
  breadcrumbs,
  documentData
}: FileMetadataListProps) {

  const router = useRouter();

  return (
    <main className="md:mx-36 px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <button
          onClick={() => router.push('/dashboard')}
          className="hover:text-gray-900 dark:hover:text-white"
        >
          My Documents
        </button>
          
          {breadcrumbs?.map((crumb, index) => {
            const path = `/dashboard/folder/${crumb.id}`;
            const isLast = index === breadcrumbs.length - 1;
            
            return (
              <div key={crumb.id} className="flex items-center gap-2">
                <span>/</span>
                {isLast ? (
                  <span className="font-medium text-gray-900 dark:text-white">
                    {crumb.name}
                  </span>
                ) : (
                  <button
                    onClick={() => router.push(path)}
                    className="hover:text-gray-900 dark:hover:text-white"
                  >
                    {crumb.name}
                  </button>
                )}
              </div>
            );
          })}
      </nav>

      {/* Show document viewer if viewing a document */}
      {isDocument && documentData ? (
        <FileViewer {...documentData} />
      ) : (
        <Dropzone>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
              <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                This folder is empty
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Upload documents to this folder to get started
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((item) => (
                <FileResourceItem
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  type={item.type}
                  currentPath={slug?.join('/')}
                />
              ))}
            </div>
          )}
        </Dropzone>
      )}
    </main>
  );
}
