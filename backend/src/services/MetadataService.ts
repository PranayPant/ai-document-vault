import { prisma } from '../utils/db.js';
import path from 'path';
import type { Folder } from '@generated/prisma'; 

export class MetadataService {

  /**
   * RESOLVE VIRTUAL PATH -> FOLDER ID
   * @param pathStr The relative path (e.g. "ProjectA/specs")
   * @param rootParentId The ID of the folder we are uploading INTO (optional)
   */
  async ensureFolderHierarchy(pathStr: string, rootParentId: string | null = null): Promise<string | null> {
    const segments = pathStr.split('/').filter(p => p.length > 0 && p !== '.');
    
    // If path is empty (file dropped directly in folder), return the rootParentId
    if (segments.length === 0) return rootParentId; 

    // Start looking/creating inside the target folder (or Root if null)
    let currentParentId: string | null = rootParentId;

    for (const folderName of segments) {
      let folder; 
      
      // Use standard Find-or-Create Logic
      // Note: We can use findFirst/create pattern for everything now to be safe/consistent
      // or stick to the upsert logic if parentId is known not to be null.
      // For simplicity in this logic, we use findFirst+Create to handle the null case safely.
      
      folder = await prisma.folder.findFirst({
        where: { name: folderName, parentId: currentParentId }
      });

      if (!folder) {
        folder = await prisma.folder.create({
          data: { name: folderName, parentId: currentParentId }
        });
      }

      currentParentId = folder.id;
    }
    
    return currentParentId;
  }

  /**
   * CREATE DOCUMENT METADATA
   */
  async createDocument(data: {
    originalName: string;
    storagePath: string;
    mimeType: string;
    size: number;
    userPath: string;      // e.g. "ProjectA/file.txt"
    parentFolderId?: string; // <--- NEW: Context ID
  }) {
    // 1. Get the directory part of the relative path
    // Input: "ProjectA/file.txt" -> "ProjectA"
    // Input: "file.txt" -> "." (Empty)
    const directoryPath = path.dirname(data.userPath);
    
    // 2. Resolve folder ID starting from the parent context
    const folderId = await this.ensureFolderHierarchy(
      directoryPath, 
      data.parentFolderId || null // Pass the context
    );

    return prisma.document.create({
      data: {
        originalName: data.originalName,
        storagePath: data.storagePath,
        mimeType: data.mimeType,
        size: data.size,
        userPath: data.userPath, // We store the relative path for record keeping
        folderId: folderId,
        status: 'QUEUED',
      },
    });
  }

  /**
   * FETCH FOLDER CONTENTS (Explorer View)
   */
  async getFolderContents(folderId: string | null) {
    const folders = await prisma.folder.findMany({
      where: { 
        parentId: folderId,
        deletedAt: null 
      },
      orderBy: { name: 'asc' }
    });
    
    const documents = await prisma.document.findMany({
      where: { 
        folderId: folderId,
        deletedAt: null 
      },
      orderBy: { originalName: 'asc' },
      select: {
        id: true,
        originalName: true,
        status: true,
        createdAt: true,
      }
    });

    let currentFolder = null;
    if (folderId) {
      currentFolder = await prisma.folder.findUnique({
        where: { id: folderId }
      });
    }

    return { currentFolder, folders, documents };
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

  async softDeleteDocument(id: string) {
    return prisma.document.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

export const metadataService = new MetadataService();