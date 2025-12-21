import { prisma } from '../utils/db.js';
import path from 'path';
import type { Folder } from '@generated/prisma'; 

export class MetadataService {

  /**
   * RESOLVE VIRTUAL PATH -> FOLDER ID
   * Input: "/Finance/Reports" -> Output: UUID
   */
  async ensureFolderHierarchy(pathStr: string): Promise<string | null> {
    // Filter out empty strings and "." (current directory)
    const segments = pathStr.split('/').filter(p => p.length > 0 && p !== '.');
    
    if (segments.length === 0) return null; // Root

    let currentParentId: string | null = null;

    for (const folderName of segments) {
      // 2. Declare variable with explicit type to prevent "Implicit Any" error
      let folder: Folder | null = null;

      if (currentParentId === null) {
        // --- ROOT FOLDER LOGIC (Parent is NULL) ---
        // Manual Find-or-Create to avoid "upsert null" error
        
        folder = await prisma.folder.findFirst({
          where: {
            name: folderName,
            parentId: null
          }
        });

        if (!folder) {
          folder = await prisma.folder.create({
            data: {
              name: folderName,
              parentId: null
            }
          });
        }

      } else {
        // --- SUB-FOLDER LOGIC (Parent is UUID) ---
        // Standard Upsert is safe here
        folder = await prisma.folder.upsert({
          where: {
            name_parentId: {
              name: folderName,
              parentId: currentParentId
            }
          },
          update: {}, // No updates needed
          create: {
            name: folderName,
            parentId: currentParentId
          }
        });
      }

      // Move the pointer down
      if (folder) {
        currentParentId = folder.id;
      }
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
    userPath: string;
  }) {
    // Extract directory from full path 
    const directoryPath = path.dirname(data.userPath);
    
    // Resolve logical folder ID
    const folderId = await this.ensureFolderHierarchy(directoryPath);

    return prisma.document.create({
      data: {
        originalName: data.originalName,
        storagePath: data.storagePath,
        mimeType: data.mimeType,
        size: data.size,
        userPath: data.userPath,
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