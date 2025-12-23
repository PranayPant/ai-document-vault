import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import cors from 'cors';
import multer from 'multer';
import { documentController } from './controllers/DocumentController';
import { storageService } from './services/StorageService';
import 'dotenv';

const app = express();
app.use(cors());
app.use(express.json());

// Multer Setup
const storage = multer.diskStorage({
  destination: storageService.getUploadPath(),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Validation Middlewares
const validateUpload = [
  body('filePath')
    .notEmpty()
    .withMessage('filePath is required')
    .isString()
    .withMessage('filePath must be a string'),
  body('parentFolderId')
    .notEmpty()
    .withMessage('filePath is required')
    .isString()
    .withMessage('filePath must be a string'),
  (req: Request, res: Response, next: NextFunction) => {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ 
        errors: [{ msg: 'file field is required', param: 'file' }] 
      });
    }
    
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    next();
  }
];


// 1. Upload
app.post('/api/documents', upload.single('file'), validateUpload, (req: Request, res: Response) => documentController.upload(req, res));

// 2. Folder Navigation (Tree View)
app.get('/api/folders/:folderId', (req, res) => documentController.getFolder(req, res));

// 3. Document Details (File View)
app.get('/api/documents/:id', (req, res) => documentController.getOne(req, res));

// 4. Preview Document (inline)
app.get('/files/:id/preview', (req, res) => documentController.preview(req, res));

// 5. Download Document
app.get('/files/:id/download', (req, res) => documentController.download(req, res));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});