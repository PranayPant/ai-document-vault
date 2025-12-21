import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { documentController } from '@controllers/DocumentController';
import { storageService } from '@services/StorageService';

const app = express();
app.use(cors());
app.use(express.json());

// Setup Multer
const storage = multer.diskStorage({
  destination: storageService.getUploadPath(),
  filename: (req, file, cb) => cb(null, file.originalname) // Simple filename for prototype
});
const upload = multer({ storage });

// Routes
app.post('/api/documents', upload.single('file'), (req, res) => documentController.upload(req, res));
app.get('/api/documents', (req, res) => documentController.getAll(req, res));
app.use('/files', express.static(storageService.getUploadPath()));

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));