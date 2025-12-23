import { Request, Response } from 'express';
import { metadataService } from '../services/MetadataService.js';
import { queueService } from '../services/QueueService.js';
import { storageService } from '../services/StorageService.js';

class DocumentController {

  // Route: GET /files/:id/download
  async download(req: Request, res: Response) {
    try {
      const doc = await metadataService.getDocumentById(req.params.id);
      
      if (!doc) {
        return res.status(404).send('Document not found');
      }

      const fullPath = storageService.getPhysicalPath(doc.storagePath);

      res.download(fullPath, doc.originalName, (err) => {
        if (err) {
            console.error("Download error:", err);
            if (!res.headersSent) res.status(500).send("Could not download file");
        }
      });

    } catch (e) {
      console.error(e);
      res.status(500).send('Server Error');
    }
  }

  // Route: GET /files/:id/preview
  async preview(req: Request, res: Response) {
    try {
      const doc = await metadataService.getDocumentById(req.params.id);
      if (!doc) return res.status(404).send('Not found');

      const fullPath = storageService.getPhysicalPath(doc.storagePath);

      res.setHeader('Content-Type', doc.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);

      res.sendFile(fullPath, (err) => {
        if (err && !res.headersSent) {
           console.error("Preview error:", err);
           res.status(500).send("Preview failed");
        }
      });
    } catch (e) {
      console.error(e);
      res.status(500).send('Server Error');
    }
  }
  
  // Route: POST /api/documents
  async upload(req: Request, res: Response) {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Enforced by validation middleware
    const parentFolderId = req.body.parentFolderId;
    const relativePath = req.body.filePath

    try {
      const doc = await metadataService.createDocument({
        originalName: req.file.originalname,
        storagePath: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        parentFolderId,
        relativePath
      });

      await queueService.addJob(doc.id);

      res.status(202).json({ 
        message: 'Upload accepted', 
        documentId: doc.id 
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Upload failed' });
    }
  }

  // GET /api/folders/:folderId
  async getFolder(req: Request, res: Response) {
    try {
      let folderId: string | null = req.params.folderId;

      if(!folderId) {
        throw new Error("Folder ID is required");
      }

      let contents;

      if (folderId === 'root') {
        contents = await metadataService.getRootFolderMetadata();
      } else {
        // Otherwise, treat as UUID
        contents = await metadataService.getFolderMetadata(folderId);
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
        documents: mappedDocs
      });
    } catch (e) {
      console.error(e);
      res.status(404).json({ error: 'Folder not found' });
    }
  }

  // GET /api/documents/:id
  // Handles File Selection (Metadata + Content Link)
  async getOne(req: Request, res: Response) {
    try {
      const doc = await metadataService.getDocumentById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Not found' });

      const port = process.env.PORT || 3001;
      const baseUrl = `http://localhost:${port}`;

      const { storagePath, ...safeDoc } = doc;

      res.json({
        ...safeDoc,
        previewUrl: `${baseUrl}/files/${doc.id}/preview`,
        downloadUrl: `${baseUrl}/files/${doc.id}/download`
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  }
}

export const documentController = new DocumentController();