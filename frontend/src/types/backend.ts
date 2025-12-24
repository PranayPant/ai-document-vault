/**
 * Infers types of API route responses from backend server.ts and DocumentController.ts
 * to be used in the frontend.
 */

// Document status from Prisma schema
export type DocumentStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

// Document DTO (from backend DocumentController.getOne and getFolder)
export interface DocumentDto {
  id: string;
  originalName: string;
  folderId?: string | null;
  status: DocumentStatus;
  summary?: string;
  markdown?: string;
  createdAt: string; // ISO date string
  downloadUrl?: string;
  previewUrl?: string;
  breadcrumbs?: Breadcrumb[];
}

// Folder DTO
export interface FolderDto {
  id: string;
  name: string;
  parentId: string | null;
  userPath: string;
  createdAt: string;
}

// POST /api/documents response
export interface UploadResponse {
  message: string;
  documentId: string;
}

export type Breadcrumb = {
  id: string;
  name: string;
}

// GET /api/folders/:folderId response
export interface FolderContentsResponse {
  metadata: FolderDto | null;
  folders: FolderDto[];
  documents: DocumentDto[];
  breadcrumbs: Breadcrumb[];
}

// GET /api/documents/:id response
export type DocumentDetailsResponse = DocumentDto;

// Error response
export interface ErrorResponse {
  error: string;
  errors?: Array<{ msg: string; param: string }>;
}
