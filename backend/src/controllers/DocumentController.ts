import { Request, Response } from 'express';
import { prisma } from '@utils/db';
import { queueService } from '@services/QueueService';

class DocumentController {
  
  async upload(req: Request, res: Response) {
    if (!req.file) return res.status(400).json({ error: 'No file' });

    try {
      const doc = await prisma.document.create({
        data: {
          originalName: req.file.originalname,
          storagePath: req.file.path,
          mimeType: req.file.mimetype,
          size: req.file.size,
          status: 'QUEUED'
        }
      });

      // Trigger background job
      await queueService.addJob(doc.id);

      res.status(202).json(doc);
    } catch (e) {
      res.status(500).json({ error: 'Upload failed' });
    }
  }

  async getAll(req: Request, res: Response) {
    const docs = await prisma.document.findMany({ orderBy: { createdAt: 'desc' } });
    const port = process.env.PORT || 3001;
    
    const response = docs.map(d => ({
      ...d,
      downloadUrl: `http://localhost:${port}/files/${d.originalName}`
    }));
    
    res.json(response);
  }
}

export const documentController = new DocumentController();