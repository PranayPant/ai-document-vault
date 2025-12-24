import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './logging/LoggingService.js';
import { FileSystemError } from '../shared/errors.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StorageService {
  private uploadDir = path.join(__dirname, '..', '..', 'uploads');

  constructor() {
    try {
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
        logger.info('Upload directory created', { path: this.uploadDir });
      } else {
        logger.debug('Upload directory exists', { path: this.uploadDir });
      }
    } catch (error) {
      logger.error('Failed to initialize upload directory', { 
        path: this.uploadDir,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new FileSystemError('Failed to initialize upload directory');
    }
  }

  getUploadPath() {
    return this.uploadDir;
  }

  getPhysicalPath(filename: string) {
    try {
      if (!filename) {
        throw new FileSystemError('Filename is required');
      }

      const fullPath = path.join(this.uploadDir, filename);
      
      // Security check: ensure the path is within uploadDir
      const normalizedPath = path.normalize(fullPath);
      const normalizedUploadDir = path.normalize(this.uploadDir);
      
      if (!normalizedPath.startsWith(normalizedUploadDir)) {
        logger.error('Path traversal attempt detected', { 
          filename,
          attemptedPath: normalizedPath 
        });
        throw new FileSystemError('Invalid file path');
      }

      logger.debug('Resolved physical path', { 
        filename,
        fullPath 
      });

      return fullPath;
    } catch (error) {
      if (error instanceof FileSystemError) {
        throw error;
      }
      logger.error('Failed to resolve physical path', { 
        filename,
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw new FileSystemError('Failed to resolve file path');
    }
  }
  
}

export const storageService = new StorageService();