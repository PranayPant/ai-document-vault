import FileMetadataList from '@/src/components/FileMetadataList';
import FileViewer from '@/src/components/FileViewer';
import BreadcrumbNav from '@/src/components/BreadcrumbNav';
import { FileResource, FileResourceType } from '@/src/types/FileResource';
import type { Breadcrumb, DocumentDto, FolderContentsResponse } from '@/src/types/backend';
import { notFound } from 'next/navigation';

async function fetchFolderOrDocument(currentId: string, resourceType: FileResourceType): Promise<{
  items: FileResource[];
  breadcrumbs?: Breadcrumb[];
  documentData?: DocumentDto;
}> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  try {
    if (resourceType === FileResourceType.FOLDER) {
      // Fetch folder contents
      const response = await fetch(`${baseUrl}/api/folders/${currentId}`, {
        cache: 'force-cache'
      });
      
      if (!response.ok) notFound();
      
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

      const breadcrumbs = data.breadcrumbs;
      
      return {
        items: [...folders, ...documents],
        breadcrumbs
      };
    } else {
      const response = await fetch(`${baseUrl}/api/documents/${currentId}`, {
        cache: 'force-cache'
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch document data");
      }
      
      const {breadcrumbs, ...documentData}: DocumentDto = await response.json();

      if(!documentData) {
        throw new Error("Document data not found");
      }
      
      return {
        items: [],
        breadcrumbs,
        documentData
      };
    }
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
  
  if (!slug || slug.length < 2 || slug.length % 2 !== 0) {
    // Slug must be in pairs: ['folder', 'uuid-1'] or ['folder', 'uuid-1', 'document', 'uuid-2']
    notFound();
  }
  
  // Get the last pair (type and id)
  const resourceTypeString = slug[slug.length - 2];
  const currentId = slug[slug.length - 1];
  
  // Map URL string to enum
  const resourceType = resourceTypeString === 'folder' 
    ? FileResourceType.FOLDER 
    : resourceTypeString === 'document' 
    ? FileResourceType.DOCUMENT 
    : null;
  
  if (!resourceType) {
    notFound();
  }
  
  const { items, breadcrumbs, documentData } = await fetchFolderOrDocument(currentId, resourceType);

  // Validate document data exists for document views
  if (resourceType === FileResourceType.DOCUMENT && !documentData) {
    notFound();
  }

  return (
    <main className="md:mx-36 px-4 py-8 sm:px-6 lg:px-8">
      <BreadcrumbNav 
        breadcrumbs={breadcrumbs} 
        currentItemName={documentData?.originalName}
      />
      
      {resourceType === FileResourceType.FOLDER ? (
        <FileMetadataList items={items} slug={slug} />
      ) : (
        <FileViewer {...documentData!} />
      )}
    </main>
  );
}