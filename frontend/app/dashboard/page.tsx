import FileResourceItem from '@/src/components/FileResourceItem';
import { FileResource, FileResourceType } from '@/src/types/FileResource';
import type { FolderContentsResponse } from '@/src/types/backend';

async function getRootFolders(): Promise<FileResource[]> {
  try {
    // Fetch root folder contents through Next.js API route
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/folders/root`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      console.error('Failed to fetch folders');
      return [];
    }
    
    const data: FolderContentsResponse = await response.json();
    
    // Map folders and documents to FileResource format
    const folders: FileResource[] = data.folders.map(folder => ({
      id: folder.id,
      name: folder.name,
      type: FileResourceType.FOLDER
    }));
    
    const documents: FileResource[] = data.documents.map(doc => ({
      id: doc.id,
      name: doc.originalName,
      type: FileResourceType.DOCUMENT
    }));
    
    return [...folders, ...documents];
  } catch (error) {
    console.error('Error fetching root folders:', error);
    return [];
  }
}

export default async function DashboardPage() {
  const items = await getRootFolders();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          My Documents
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Browse your folders and documents
        </p>
      </div>

      {items.length === 0 ? (
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
          {items.map((item) => (
            <FileResourceItem
              key={item.id}
              id={item.id}
              name={item.name}
              type={item.type}
            />
          ))}
        </div>
      )}
    </main>
  );
}
