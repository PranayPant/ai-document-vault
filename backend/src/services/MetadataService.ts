import path from 'path';
import { prisma } from '../utils/db.js';
import { Folder } from '@generated/prisma';

export class MetadataService {

  /**
   * Walks up the tree from current folder to root.
   */
  private async getBreadcrumbs(folderId: string) {
    const breadcrumbs: { id: string; name: string }[] = [];
    let currentId: string | null = folderId;

    while (currentId) {
      const fetchedFolder: Folder | null = await prisma.folder.findUnique({
        where: { id: currentId }
      });

      if (!fetchedFolder) break;

      breadcrumbs.unshift({ id: fetchedFolder.id, name: fetchedFolder.name });
      currentId = fetchedFolder.parentId;
    }
    
    return breadcrumbs;
  }

  async getDocumentDetails(docId: string) {
    const doc = await prisma.document.findUnique({
      where: { id: docId }
    });

    if (!doc) return null;

    let breadcrumbs: { id: string; name: string }[] = [];

    // If doc belongs to a folder, calculate the path
    if (doc.folderId) {
      breadcrumbs = await this.getBreadcrumbs(doc.folderId);
    }

    // Return flattened object
    return {
      ...doc,
      breadcrumbs
    };
  }


  /**
   * @param relativePathStr - e.g. "Data/2024/Logs" (excluding filename)
   * @param rootParentId - The UUID of the folder where the user dropped the files
   */
  async ensureFolderHierarchy(relativePathStr: string, rootParentId: string): Promise<string> {
    // Normalize and split the path into segments
    // Input: "Data/2024/Logs" -> ["Data", "2024", "Logs"]
    // Input: "." or "" -> []
    const segments = relativePathStr.split('/').filter(p => p.length > 0 && p !== '.' && p !== '/');

    let currentParentId = rootParentId;

    for (const folderName of segments) {
      const folder = await prisma.folder.upsert({
        where: {
          name_parentId: {
            name: folderName,
            parentId: currentParentId
          }
        },
        update: {}, // No changes if exists
        create: {
          name: folderName,
          parentId: currentParentId
        }
      });

      currentParentId = folder.id;
    }

    return currentParentId;
  }

  async createDocument(data: {
    originalName: string;
    storagePath: string;
    mimeType: string;
    size: number;
    parentFolderId: string; // Where the drop happened
    relativePath: string;   // The full path of the file (e.g. "Data/2024/file.pdf")
  }) {

    // 1. Validate root parent exists
    // Note: We assume "root-uuid" is valid if passed, or query DB to be safe
    // If you strictly require UUIDs, this query is good safety:
    const rootExists = await prisma.folder.findUnique({ where: { id: data.parentFolderId } });
    if (!rootExists) throw new Error("Target folder does not exist");

    // 2. Extract directory path from full relative path
    // Input: "Data/2024/file.pdf" -> "Data/2024"
    // Input: "file.pdf" -> "."
    const dirName = path.dirname(data.relativePath);

    // 3. Resolve the final destination folder ID
    const finalFolderId = await this.ensureFolderHierarchy(dirName, data.parentFolderId);

    // 4. Create the document
    return prisma.document.create({
      data: {
        originalName: data.originalName,
        storagePath: data.storagePath,
        mimeType: data.mimeType,
        size: data.size,
        folderId: finalFolderId, // Linked to the newly created/found sub-folder
        status: 'QUEUED',
      },
    });
  }

  /**
   * Uses findFirst({ where: { parentId: null } })
   */
  async getRootFolderMetadata() {
    // 1. Find the Root Folder (where parentId is null)
    const rootFolder = await prisma.folder.findFirst({
      where: { parentId: null },
      include: {
        children: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true, parentId: true, createdAt: true }
        },
        documents: {
          orderBy: { originalName: 'asc' },
          select: { id: true, originalName: true, status: true, createdAt: true, mimeType: true, size: true }
        }
      }
    });

    if (!rootFolder) {
      throw new Error("System Root folder not found. Please run seed.");
    }

    return {
      currentFolder: {
        id: rootFolder.id,
        name: rootFolder.name,
        parentId: null
      },
      breadcrumbs: [{ id: rootFolder.id, name: rootFolder.name }],
      folders: rootFolder.children,
      documents: rootFolder.documents
    };
  }

 /**
   * Get top-level folder metatdata of sub-folders, and documents in one go.
   * Uses JOINs (via Prisma include) to fetch hierarchy in one round-trip.
   */
  async getFolderMetadata(folderId: string) {
    const folderWithContents = await prisma.folder.findUnique({
      where: { 
        id: folderId,
      },
      include: {
        // JOIN 1: Fetch Sub-folders
        children: {
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            parentId: true,
            createdAt: true
          }
        },
        // JOIN 2: Fetch Documents
        documents: {
          orderBy: { originalName: 'asc' },
          select: {
            id: true,
            originalName: true,
            status: true,
            createdAt: true,
            mimeType: true,
            size: true
          }
        }
      }
    });

    if (!folderWithContents) {
      throw new Error("Folder not found");
    }

    const breadcrumbs = await this.getBreadcrumbs(folderId);

    // Flatten the result for the Controller
    return {
      currentFolder: {
        id: folderWithContents.id,
        name: folderWithContents.name,
        parentId: folderWithContents.parentId
      },
      breadcrumbs,
      folders: folderWithContents.children,
      documents: folderWithContents.documents
    };
  }

  async getDocumentById(id: string) {
    return prisma.document.findUnique({ where: { id } });
  }

  async updateStatus(id: string, status: string) {
    return prisma.document.update({
      where: { id },
      data: { status }
    });
  }

  async saveAIResults(id: string, summary: string, markdown: string) {
    return prisma.document.update({
      where: { id },
      data: { status: 'COMPLETED', summary, markdown }
    });
  }
}

export const metadataService = new MetadataService();