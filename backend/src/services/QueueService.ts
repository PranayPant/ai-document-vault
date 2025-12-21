import { prisma } from '@utils/db';
import { aiService } from '@services/AIService';

class QueueService {
  
  // This mimics "queue.add()"
  async addJob(documentId: string) {
    console.log(`[Queue] Queued ${documentId}`);
    // FIRE AND FORGET (No await)
    this.processJob(documentId);
  }

  private async processJob(documentId: string) {
    try {
      const doc = await prisma.document.findUnique({ where: { id: documentId } });
      if (!doc) return;

      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'PROCESSING' }
      });

      // Extract & Analyze
      const text = await aiService.extractText(doc.storagePath);
      const { summary, markdown } = await aiService.generateInsights(text);

      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'COMPLETED', summary, markdown }
      });
      console.log(`[Queue] Completed ${documentId}`);

    } catch (e) {
      console.error(`[Queue] Failed ${documentId}`, e);
      await prisma.document.update({
        where: { id: documentId },
        data: { status: 'FAILED' }
      });
    }
  }
}

export const queueService = new QueueService();