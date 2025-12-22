import { Request, Response } from 'express';
import { metadataService } from '../services/MetadataService.js';
import { queueService } from '../services/QueueService.js';

class DocumentController {

  async download(req: Request, res: Response) {
    try {
      const doc = await metadataService.getDocumentById(req.params.id);
      
      if (!doc) {
        return res.status(404).send('Document not found');
      }

      // Express helper:
      // 1. Reads file from doc.storagePath
      // 2. Sets 'Content-Disposition' header so browser sees 'doc.originalName'
      // 3. Streams the file to the client
      res.download(doc.storagePath, doc.originalName, (err) => {
        if (err) {
            // Handle error, but response might be partially sent already
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

      // Set headers to tell browser to RENDER it
      res.setHeader('Content-Type', doc.mimeType);
      // "inline" = Attempt to display in browser/iframe
      res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);

      // Stream the file
      res.sendFile(doc.storagePath, (err) => {
        if (err && !res.headersSent) res.status(500).send("Preview failed");
      });
    } catch (e) {
      console.error(e);
      res.status(500).send('Server Error');
    }
  }
  
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
        downloadUrl: `http://localhost:${port}/files/${d.id}`
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

      const port = process.env.PORT || 3001;
      const baseUrl = `http://localhost:${port}`;

      const { storagePath, userPath, ...safeDoc } = doc;

      res.json({
        ...safeDoc,
        // Used for the <iframe> source (Left Pane)
        previewUrl: `${baseUrl}/files/${doc.id}/preview`,
        // Used for the "Download" button
        downloadUrl: `${baseUrl}/files/${doc.id}/download`
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  }
}

export const documentController = new DocumentController();