import DynamicDashboardContent from '@/src/components/DynamicDashboardContent';
import { FileResource, FileResourceType } from '@/src/types/FileResource';
import type { FolderContentsResponse } from '@/src/types/backend';
import { notFound } from 'next/navigation';

async function fetchFolderOrDocument(currentId: string): Promise<{
  items: FileResource[];
  isDocument: boolean;
  documentId?: string;
}> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  try {
    // First, try to fetch as a folder through Next.js API route
    const folderResponse = await fetch(`${baseUrl}/api/folders/${currentId}`, {
      cache: 'no-store'
    });
    
    if (folderResponse.ok) {
      const data: FolderContentsResponse = await folderResponse.json();
      
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
      
      return {
        items: [...folders, ...documents],
        isDocument: false
      };
    }
    
    // If it's not a folder, try as a document through Next.js API route
    const docResponse = await fetch(`${baseUrl}/api/documents/${currentId}`, {
      cache: 'no-store'
    });
    
    if (docResponse.ok) {
      return {
        items: [],
        isDocument: true,
        documentId: currentId
      };
    }
    
    // If neither worked, return not found
    notFound();
  } catch (error) {
    console.error('Error fetching data:', error);
    notFound();
  }
}

export default async function DynamicDashboardPage({
  params
}: {
  params: Promise<{ slug?: string[] }>
}) {
  const {slug} = await params;
  
  // Get the current ID (last item in slug)
  const currentId = slug?.[slug.length - 1];
  
  if (!currentId) {
    notFound();
  }
  
  const { items, isDocument, documentId } = await fetchFolderOrDocument(currentId);

  return (
    <DynamicDashboardContent
      items={items}
      slug={slug}
      isDocument={isDocument}
      documentId={documentId}
    />
  );
}