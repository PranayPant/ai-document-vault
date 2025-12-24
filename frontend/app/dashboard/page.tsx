import FileResourceItem from '@/src/components/FileResourceItem';
import { FileResource, FileResourceType } from '@/src/types/FileResource';
import type { FolderContentsResponse } from '@/src/types/backend';

async function getRootFolder(): Promise<FileResource | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/folders/root`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error('Failed to fetch folders');
      return null;
    }
    
    const {metadata}: FolderContentsResponse = await response.json();

    if(!metadata) {
      throw new Error("Metadata not found for root folder");
    }
    
    const rootFolder: FileResource = {
      id: metadata.id,
      name: metadata.name,
      type: FileResourceType.FOLDER
    }

    return rootFolder;
  } catch (error) {
    console.error('Error fetching root folder:', error);
    return null;
  }
}

export default async function DashboardPage() {
  const rootFolder = await getRootFolder();

  return (
    <main className="md:mx-36 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Documents
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Browse your folders and documents
        </p>
      </div>

      {!rootFolder ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-700 dark:bg-gray-800">
          <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No documents yet
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Get started by uploading your first document
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <FileResourceItem
              key={rootFolder.id}
              id={rootFolder.id}
              name={rootFolder.name}
              type={rootFolder.type}
            />
          
        </div>
      )}
    </main>
  );
}
