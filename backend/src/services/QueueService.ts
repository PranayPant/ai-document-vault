import { metadataService } from './MetadataService.js';
import { aiService } from './AIService.js';
import { storageService } from './StorageService.js';
import { logger } from './logging/LoggingService.js';

class QueueService {
  
  async addJob(documentId: string) {
    try {
      if (!documentId) {
        logger.error('Cannot add job without document ID');
        return;
      }

      logger.info('Job queued for processing', { documentId });
      
      // Start processing asynchronously
      this.processJob(documentId).catch(error => {
        logger.error('Unhandled error in background job processing', { 
          documentId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      });
    } catch (error) {
      logger.error('Failed to queue job', { 
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
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
      logger.info('Starting job processing', { documentId });

      // 1. Fetch Metadata
      const doc = await metadataService.getDocumentById(documentId);
      if (!doc) {
        logger.warn('Document not found for job processing', { documentId });
        return;
      }

      logger.debug('Document metadata retrieved', { 
        documentId,
        fileName: doc.originalName,
        status: doc.status
      });

      // 2. Set Status to PROCESSING
      await metadataService.updateStatus(documentId, 'PROCESSING');
      logger.info('Document status updated to PROCESSING', { documentId });

      // 3. Extract & Analyze
      const fullPath = storageService.getPhysicalPath(doc.storagePath);
      logger.debug('Extracting text from document', { 
        documentId,
        filePath: fullPath 
      });

      const text = await aiService.extractText(fullPath);
      logger.info('Text extracted successfully', { 
        documentId,
        textLength: text.length 
      });

      logger.info('Generating AI insights', { documentId });
      const { summary, markdown } = await aiService.generateInsights(text);
      logger.info('AI insights generated', { 
        documentId,
        summaryLength: summary.length,
        markdownLength: markdown.length
      });

      // 4. Save Results
      await metadataService.saveAIResults(documentId, summary, markdown);
      logger.info('Job completed successfully', { 
        documentId,
        fileName: doc.originalName
      });

    } catch (error) {
      logger.error('Job processing failed', { 
        documentId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });

      try {
        await metadataService.updateStatus(documentId, 'FAILED');
        logger.info('Document status updated to FAILED', { documentId });
      } catch (updateError) {
        logger.error('Failed to update document status to FAILED', { 
          documentId,
          error: updateError instanceof Error ? updateError.message : 'Unknown error'
        });
      }
    }
  }
}

export const queueService = new QueueService();