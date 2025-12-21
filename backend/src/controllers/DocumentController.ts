import { Request, Response } from 'express';
import { metadataService } from '../services/MetadataService.js';
import { queueService } from '../services/QueueService.js';

class DocumentController {
  
  // POST /api/documents
  async upload(req: Request, res: Response) {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Expecting full path like "/Projects/2024/report.pdf"
    const userPath = req.body.filePath || '/'; 

    try {
      const doc = await metadataService.createDocument({
        originalName: req.file.originalname,
        storagePath: req.file.path, // Multer's generated path
        mimeType: req.file.mimetype,
        size: req.file.size,
        userPath: userPath 
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
  // Handles Navigation (Folder Expansion)
  async getFolder(req: Request, res: Response) {
    try {
      let folderId: string | null = req.params.folderId;
      if (folderId === 'root') folderId = null;

      const contents = await metadataService.getFolderContents(folderId);
      
      const port = process.env.PORT || 3001;
      
      // Construct download URL for preview of child files
      const mappedDocs = contents.documents.map(d => ({
        ...d,
        downloadUrl: `http://localhost:${port}/files/${d.originalName}`
      }));

      res.json({
        metadata: contents.currentFolder,
        folders: contents.folders,
        documents: mappedDocs
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to fetch folder' });
    }
  }

  // GET /api/documents/:id
  // Handles File Selection (Metadata + Content Link)
  async getOne(req: Request, res: Response) {
    try {
      const doc = await metadataService.getDocumentById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'Not found' });

      // Construct storage link
      const port = process.env.PORT || 3001;
      const downloadUrl = `http://localhost:${port}/files/${doc.originalName}`;

      res.json({
        ...doc,
        downloadUrl
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  }
}

export const documentController = new DocumentController();