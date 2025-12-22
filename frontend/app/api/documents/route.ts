import { NextRequest, NextResponse } from 'next/server';
import type { UploadResponse, ErrorResponse } from '@/src/types/backend';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// POST /api/documents - Upload a document
export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse | ErrorResponse>> {
  console.log('[API Route] POST /api/documents - Upload document');
  try {
    const formData = await request.formData();
    
    // Forward the request to the backend
    const response = await fetch(`${BACKEND_URL}/api/documents`, {
      method: 'POST',
      body: formData,
    });

    const data: UploadResponse | ErrorResponse = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
