import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StorageService {
  // Physical location on disk (flat structure)
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

  async deleteFile(filename: string): Promise<void> {
    const filePath = this.getPhysicalPath(filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        console.log(`[Storage] Deleted physical file: ${filename}`);
      } catch (err) {
        console.error(`[Storage] Failed to delete ${filename}`, err);
      }
    }
  }
}

export const storageService = new StorageService();