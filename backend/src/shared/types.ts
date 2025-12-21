export interface DocumentDto {
  id: string;
  originalName: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  summary?: string;
  markdown?: string;
  createdAt: Date;
  downloadUrl?: string;
}