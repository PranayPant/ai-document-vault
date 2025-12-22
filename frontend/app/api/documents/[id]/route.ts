import { NextRequest, NextResponse } from 'next/server';
import type { DocumentDetailsResponse, ErrorResponse } from '@/src/types/backend';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// GET /api/documents/:id - Get document details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<DocumentDetailsResponse | ErrorResponse>> {
  const { id } = await params;
  console.log(`[API Route] GET /api/documents/${id} - Get document details`);
  try {
    const response = await fetch(`${BACKEND_URL}/api/documents/${id}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Document not found' },
        { status: response.status }
      );
    }

    const data: DocumentDetailsResponse = await response.json();
    
    // The backend already includes downloadUrl
    return NextResponse.json(data);
  } catch (error) {
    console.error('Fetch document error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}
