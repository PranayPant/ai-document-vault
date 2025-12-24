import { Request, Response, NextFunction } from 'express';
import { metadataService } from '../services/MetadataService.js';
import { queueService } from '../services/QueueService.js';
import { storageService } from '../services/StorageService.js';
import { logger } from '../services/logging/LoggingService.js';
import { NotFoundError, ValidationError, AppError } from '../shared/errors.js';

class DocumentController {

  // Route: GET /files/:id/download
  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      logger.info('Download request received', { documentId: id });
      
      const doc = await metadataService.getDocumentById(id);
      
      if (!doc) {
        logger.warn('Document not found for download', { documentId: id });
        throw new NotFoundError('Document not found');
      }

      const fullPath = storageService.getPhysicalPath(doc.storagePath);
      
      logger.debug('Serving file for download', { 
        documentId: id, 
        fileName: doc.originalName,
        path: fullPath 
      });

      res.download(fullPath, doc.originalName, (err) => {
        if (err) {
          logger.error('Error during file download', { 
            documentId: id, 
            fileName: doc.originalName,
            error: err.message 
          });
          if (!res.headersSent) {
            res.status(500).json({ error: 'Could not download file' });
          }
        } else {
          logger.info('File downloaded successfully', { 
            documentId: id, 
            fileName: doc.originalName 
          });
        }
      });

    } catch (error) {
      next(error);
    }
  }

  // Route: GET /files/:id/preview
  async preview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      logger.info('Preview request received', { documentId: id });
      
      const doc = await metadataService.getDocumentById(id);
      
      if (!doc) {
        logger.warn('Document not found for preview', { documentId: id });
        throw new NotFoundError('Document not found');
      }

      const fullPath = storageService.getPhysicalPath(doc.storagePath);
      
      logger.debug('Serving file for preview', { 
        documentId: id, 
        fileName: doc.originalName,
        mimeType: doc.mimeType 
      });

      res.setHeader('Content-Type', doc.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);

      res.sendFile(fullPath, (err) => {
        if (err) {
          logger.error('Error during file preview', { 
            documentId: id, 
            fileName: doc.originalName,
            error: err.message 
          });
          if (!res.headersSent) {
            res.status(500).json({ error: 'Preview failed' });
          }
        } else {
          logger.debug('File preview served successfully', { 
            documentId: id, 
            fileName: doc.originalName 
          });
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  // Route: POST /api/documents
  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        logger.warn('Upload attempt without file');
        throw new ValidationError('No file uploaded');
      }

      const parentFolderId = req.body.parentFolderId;
      const relativePath = req.body.filePath;
      
      logger.info('Document upload started', { 
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        parentFolderId,
        relativePath
      });

      const doc = await metadataService.createDocument({
        originalName: req.file.originalname,
        storagePath: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        parentFolderId,
        relativePath
      });

      logger.info('Document metadata created', { 
        documentId: doc.id,
        fileName: req.file.originalname 
      });

      await queueService.addJob(doc.id);
      
      logger.info('Document queued for AI processing', { 
        documentId: doc.id 
      });

      res.status(202).json({ 
        message: 'Upload accepted', 
        documentId: doc.id 
      });
    } catch (error) {
      logger.error('Document upload failed', { 
        fileName: req.file?.originalname,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      next(error);
    }
  }

  // GET /api/folders/:folderId
  async getFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const folderId: string = req.params.folderId;

      if (!folderId) {
        logger.warn('Folder request without ID');
        throw new ValidationError('Folder ID is required');
      }
      
      logger.info('Folder contents requested', { folderId });

      let contents;

      if (folderId === 'root') {
        contents = await metadataService.getRootFolderMetadata();
        logger.debug('Root folder contents retrieved');
      } else {
        contents = await metadataService.getFolderMetadata(folderId);
        logger.debug('Folder contents retrieved', { 
          folderId,
          folderCount: contents.folders.length,
          documentCount: contents.documents.length
        });
      }
      
      const port = process.env.PORT || 3001;
      
      // Construct download URL for preview of child files
      const mappedDocs = contents.documents.map(d => ({
        ...d,
        downloadUrl: `http://localhost:${port}/files/${d.id}`
      }));

      res.json({
        metadata: contents.currentFolder,
        folders: contents.folders,
        documents: mappedDocs,
        breadcrumbs: contents.breadcrumbs,
      });
    } catch (error) {
      logger.error('Failed to fetch folder contents', { 
        folderId: req.params.folderId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      next(error);
    }
  }

  // GET /api/documents/:id
  // Handles File Selection (Metadata + Content Link)
  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      logger.info('Document details requested', { documentId: id });
      
      const doc = await metadataService.getDocumentDetails(id);
      
      if (!doc) {
        logger.warn('Document not found', { documentId: id });
        throw new NotFoundError('Document not found');
      }

      const port = process.env.PORT || 3001;
      const baseUrl = `http://localhost:${port}`;

      const { storagePath, ...safeDoc } = doc;
      
      logger.debug('Document details retrieved', { 
        documentId: id,
        fileName: doc.originalName,
        status: doc.status
      });

      res.json({
        ...safeDoc,
        previewUrl: `${baseUrl}/files/${doc.id}/preview`,
        downloadUrl: `${baseUrl}/files/${doc.id}/download`
      });
    } catch (error) {
      logger.error('Failed to fetch document details', { 
        documentId: req.params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      next(error);
    }
  }
}

export const documentController = new DocumentController();