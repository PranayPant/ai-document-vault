import path from 'path';
import { prisma } from '../utils/db.js';
import { Folder } from '@generated/prisma';
import { logger } from './logging/LoggingService.js';
import { NotFoundError, DatabaseError, ValidationError } from '../shared/errors.js';

export class MetadataService {

  /**
   * Walks up the tree from current folder to root.
   */
  private async getBreadcrumbs(folderId: string) {
    try {
      const breadcrumbs: { id: string; name: string }[] = [];
      let currentId: string | null = folderId;

      while (currentId) {
        const fetchedFolder: Folder | null = await prisma.folder.findUnique({
          where: { id: currentId }
        });

        if (!fetchedFolder) {
          logger.warn('Folder not found while building breadcrumbs', { folderId: currentId });
          break;
        }

        breadcrumbs.unshift({ id: fetchedFolder.id, name: fetchedFolder.name });
        currentId = fetchedFolder.parentId;
      }
      
      logger.debug('Breadcrumbs generated', { folderId, count: breadcrumbs.length });
      return breadcrumbs;
    } catch (error) {
      logger.error('Failed to generate breadcrumbs', { 
        folderId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new DatabaseError('Failed to retrieve folder hierarchy');
    }
  }

  async getDocumentDetails(docId: string) {
    try {
      if (!docId) {
        throw new ValidationError('Document ID is required');
      }

      logger.debug('Fetching document details', { docId });

      const doc = await prisma.document.findUnique({
        where: { id: docId }
      });

      if (!doc) {
        logger.warn('Document not found', { docId });
        return null;
      }

      let breadcrumbs: { id: string; name: string }[] = [];

      // If doc belongs to a folder, calculate the path
      if (doc.folderId) {
        breadcrumbs = await this.getBreadcrumbs(doc.folderId);
      }

      logger.info('Document details retrieved', { 
        docId, 
        fileName: doc.originalName,
        status: doc.status
      });

      // Return flattened object
      return {
        ...doc,
        breadcrumbs
      };
    } catch (error) {
      if (error instanceof ValidationError || error instanceof DatabaseError) {
        throw error;
      }
      logger.error('Failed to get document details', { 
        docId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new DatabaseError('Failed to retrieve document details');
    }
  }


  /**
   * @param relativePathStr - e.g. "Data/2024/Logs" (excluding filename)
   * @param rootParentId - The UUID of the folder where the user dropped the files
   */
  async ensureFolderHierarchy(relativePathStr: string, rootParentId: string): Promise<string> {
    try {
      logger.debug('Ensuring folder hierarchy', { relativePath: relativePathStr, rootParentId });

      // Normalize and split the path into segments
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

        logger.debug('Folder ensured', { 
          folderName, 
          folderId: folder.id, 
          isNew: folder.createdAt === folder.updatedAt 
        });

        currentParentId = folder.id;
      }

      logger.info('Folder hierarchy ensured', { 
        relativePath: relativePathStr, 
        finalFolderId: currentParentId 
      });

      return currentParentId;
    } catch (error) {
      logger.error('Failed to ensure folder hierarchy', { 
        relativePath: relativePathStr, 
        rootParentId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new DatabaseError('Failed to create folder structure');
    }
  }

  async createDocument(data: {
    originalName: string;
    storagePath: string;
    mimeType: string;
    size: number;
    parentFolderId: string;
    relativePath: string;
  }) {
    try {
      logger.info('Creating document metadata', { 
        fileName: data.originalName,
        parentFolderId: data.parentFolderId,
        relativePath: data.relativePath
      });

      // 1. Validate root parent exists
      const rootExists = await prisma.folder.findUnique({ 
        where: { id: data.parentFolderId } 
      });
      
      if (!rootExists) {
        logger.error('Target folder does not exist', { 
          parentFolderId: data.parentFolderId 
        });
        throw new NotFoundError('Target folder does not exist');
      }

      // 2. Extract directory path from full relative path
      const dirName = path.dirname(data.relativePath);

      // 3. Resolve the final destination folder ID
      const finalFolderId = await this.ensureFolderHierarchy(dirName, data.parentFolderId);

      // 4. Create the document
      const document = await prisma.document.create({
        data: {
          originalName: data.originalName,
          storagePath: data.storagePath,
          mimeType: data.mimeType,
          size: data.size,
          folderId: finalFolderId,
          status: 'QUEUED',
        },
      });

      logger.info('Document metadata created', { 
        documentId: document.id,
        fileName: data.originalName,
        folderId: finalFolderId
      });

      return document;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }
      logger.error('Failed to create document', { 
        fileName: data.originalName,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new DatabaseError('Failed to create document metadata');
    }
  }

  /**
   * Uses findFirst({ where: { parentId: null } })
   */
  async getRootFolderMetadata() {
    try {
      logger.debug('Fetching root folder metadata');

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
        logger.error('Root folder not found in database');
        throw new NotFoundError('System Root folder not found. Please run database seed.');
      }

      logger.info('Root folder metadata retrieved', { 
        folderId: rootFolder.id,
        childCount: rootFolder.children.length,
        documentCount: rootFolder.documents.length
      });

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
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to get root folder metadata', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new DatabaseError('Failed to retrieve root folder');
    }
  }

 /**
   * Get top-level folder metatdata of sub-folders, and documents in one go.
   * Uses JOINs (via Prisma include) to fetch hierarchy in one round-trip.
   */
  async getFolderMetadata(folderId: string) {
    try {
      if (!folderId) {
        throw new ValidationError('Folder ID is required');
      }

      logger.debug('Fetching folder metadata', { folderId });

      const folderWithContents = await prisma.folder.findUnique({
        where: { 
          id: folderId,
        },
        include: {
          children: {
            orderBy: { name: 'asc' },
            select: {
              id: true,
              name: true,
              parentId: true,
              createdAt: true
            }
          },
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
        logger.warn('Folder not found', { folderId });
        throw new NotFoundError('Folder not found');
      }

      const breadcrumbs = await this.getBreadcrumbs(folderId);

      logger.info('Folder metadata retrieved', { 
        folderId,
        folderName: folderWithContents.name,
        childCount: folderWithContents.children.length,
        documentCount: folderWithContents.documents.length
      });

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
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DatabaseError) {
        throw error;
      }
      logger.error('Failed to get folder metadata', { 
        folderId, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new DatabaseError('Failed to retrieve folder contents');
    }
  }

  async getDocumentById(id: string) {
    try {
      if (!id) {
        throw new ValidationError('Document ID is required');
      }

      logger.debug('Fetching document by ID', { documentId: id });

      const document = await prisma.document.findUnique({ where: { id } });
      
      if (document) {
        logger.debug('Document found', { documentId: id, fileName: document.originalName });
      } else {
        logger.warn('Document not found', { documentId: id });
      }

      return document;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('Failed to get document by ID', { 
        documentId: id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new DatabaseError('Failed to retrieve document');
    }
  }

  async updateStatus(id: string, status: string) {
    try {
      if (!id || !status) {
        throw new ValidationError('Document ID and status are required');
      }

      logger.info('Updating document status', { documentId: id, status });

      const document = await prisma.document.update({
        where: { id },
        data: { status }
      });

      logger.info('Document status updated', { 
        documentId: id, 
        status,
        fileName: document.originalName
      });

      return document;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('Failed to update document status', { 
        documentId: id, 
        status,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new DatabaseError('Failed to update document status');
    }
  }

  async saveAIResults(id: string, summary: string, markdown: string) {
    try {
      if (!id || !summary || !markdown) {
        throw new ValidationError('Document ID, summary, and markdown are required');
      }

      logger.info('Saving AI results', { documentId: id });

      const document = await prisma.document.update({
        where: { id },
        data: { status: 'COMPLETED', summary, markdown }
      });

      logger.info('AI results saved', { 
        documentId: id,
        fileName: document.originalName,
        summaryLength: summary.length,
        markdownLength: markdown.length
      });

      return document;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      logger.error('Failed to save AI results', { 
        documentId: id,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new DatabaseError('Failed to save AI analysis results');
    }
  }
}

export const metadataService = new MetadataService();