import { NextRequest, NextResponse } from 'next/server';
import type { FolderContentsResponse, ErrorResponse } from '@/src/types/backend';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// GET /api/folders/:folderId - Get folder contents
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
): Promise<NextResponse<FolderContentsResponse | ErrorResponse>> {
  const { folderId } = await params;
  console.log(`[API Route] GET /api/folders/${folderId} - Get folder contents`);
  try {
    const response = await fetch(`${BACKEND_URL}/api/folders/${folderId}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Folder not found' },
        { status: response.status }
      );
    }

    const data: FolderContentsResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Fetch folder error:', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Failed to fetch folder contents' },
      { status: 500 }
    );
  }
}
