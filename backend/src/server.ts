import express, { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import cors from 'cors';
import multer from 'multer';
import { documentController } from './controllers/DocumentController';
import { storageService } from './services/StorageService';
import { logger } from './services/logging/LoggingService';
import { AppError } from './shared/errors';

import 'dotenv/config';

// Configure it before defining app or routes so we capture everything.
if (process.env.NODE_ENV === 'production') {
  // In Prod: Maybe we want Console (for AWS CloudWatch) AND a remote service
  // logger.clearProviders(); // Optional: Clear default console if you don't want it
  
  // Example: Add a remote provider (extensibility)
  // logger.addProvider(new RemoteProvider(process.env.LOGGING_ENDPOINT));
  
  logger.setMinLevel(1); // INFO and above
} else {
  // In Dev: Default ConsoleProvider is already there from constructor.
  // We can set level to DEBUG
  logger.setMinLevel(0); // DEBUG and above
}

logger.info("🚀 Logger initialized successfully");

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
app.post('/api/documents', upload.single('file'), validateUpload, (req: Request, res: Response, next: NextFunction) => documentController.upload(req, res, next));

// 2. Folder Navigation (Tree View)
app.get('/api/folders/:folderId', (req: Request, res: Response, next: NextFunction) => documentController.getFolder(req, res, next));

// 3. Document Details (File View)
app.get('/api/documents/:id', (req: Request, res: Response, next: NextFunction) => documentController.getOne(req, res, next));

// 4. Preview Document (inline)
app.get('/files/:id/preview', (req: Request, res: Response, next: NextFunction) => documentController.preview(req, res, next));

// 5. Download Document
app.get('/files/:id/download', (req: Request, res: Response, next: NextFunction) => documentController.download(req, res, next));

// Global Error Handler Middleware (must be last)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // If headers already sent, delegate to default error handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle custom AppError instances
  if (err instanceof AppError) {
    logger.error('Application error', {
      path: req.path,
      method: req.method,
      statusCode: err.statusCode,
      message: err.message,
      isOperational: err.isOperational,
      stack: err.stack
    });

    // Send clean error response to client (no stack trace)
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        statusCode: err.statusCode
      }
    });
  }

  // Handle unexpected errors (non-operational)
  logger.error('Unexpected error', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack
  });

  // Don't leak internal error details to client
  return res.status(500).json({
    error: {
      message: 'Internal server error',
      statusCode: 500
    }
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Backend running at http://localhost:${PORT}`);
});