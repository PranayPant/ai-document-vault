import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StorageService {
  private uploadDir = path.join(__dirname, '..', '..', 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  getUploadPath() {
    return this.uploadDir;
  }

  getPhysicalPath(filename: string) {
    return path.join(this.uploadDir, filename);
  }
  
}

export const storageService = new StorageService();