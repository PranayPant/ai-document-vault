import { metadataService } from './MetadataService.js';
import { aiService } from './AIService.js';
import { storageService } from './StorageService.js';

class QueueService {
  
  async addJob(documentId: string) {
    console.log(`[Queue] Queued Job for Doc: ${documentId}`);
    this.processJob(documentId);
  }

  /**
   * 
   * @param documentId uuid of the document in SQLite
   * @returns void
   * @description Processes the document: 
   * Extracts text, generates AI insights, and updates metadata.
   * This is done asynchronously to avoid blocking the upload response.
   */
  private async processJob(documentId: string) {
    try {
      // 1. Fetch Metadata
      const doc = await metadataService.getDocumentById(documentId);
      if (!doc) return;

      // 2. Set Status to PROCESSING
      await metadataService.updateStatus(documentId, 'PROCESSING');

      // 3. Extract & Analyze
      const fullPath = storageService.getPhysicalPath(doc.storagePath);
      const text = await aiService.extractText(fullPath);
      const { summary, markdown } = await aiService.generateInsights(text);

      // 4. Save Results
      await metadataService.saveAIResults(documentId, summary, markdown);
      console.log(`[Queue] Completed Job for Doc: ${documentId}`);

    } catch (e) {
      console.error(`[Queue] Failed Job for Doc: ${documentId}`, e);
      await metadataService.updateStatus(documentId, 'FAILED');
    }
  }
}

export const queueService = new QueueService();