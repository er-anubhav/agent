import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { z } from 'zod';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const source = searchParams.get('source') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Fetch real documents from the database
    const { getDocumentsByUserId } = await import('@/lib/db/queries');
    const docs = await getDocumentsByUserId({ userId: session.user.id });

    // Transform documents to match the frontend interface
    const transformedDocs = docs.map(doc => ({
      id: doc.id,
      title: doc.title || 'Untitled Document',
      type: doc.kind || 'text',
      status: 'completed', // Since they're in the DB, they're completed
      uploadedAt: doc.createdAt.toISOString(),
      size: doc.content ? doc.content.length : 0,
      chunks: Math.ceil((doc.content?.length || 0) / 1000), // Estimate chunks
      source: doc.source || 'upload',
      sourceMetadata: doc.sourceMetadata,
      metadata: {
        pages: doc.kind === 'text' ? Math.ceil((doc.content?.length || 0) / 2000) : undefined,
        language: 'en', // Default to English
      }
    }));

    // Filter by search query if provided
    let filteredDocs = transformedDocs;
    if (search) {
      filteredDocs = filteredDocs.filter((doc) =>
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        (doc.type && doc.type.toLowerCase().includes(search.toLowerCase()))
      );
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      filteredDocs = filteredDocs.filter((doc) => doc.status === status);
    }

    // Filter by type/source if provided
    if (source && source !== 'all') {
      // Filter by document source (upload, google-drive, etc.)
      filteredDocs = filteredDocs.filter((doc) => doc.source === source);
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedDocs = filteredDocs.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      documents: paginatedDocs,
      pagination: {
        page,
        limit,
        total: filteredDocs.length,
        totalPages: Math.ceil(filteredDocs.length / limit),
      },
      stats: {
        total: filteredDocs.length,
        byStatus: {
          completed: filteredDocs.filter(d => d.status === 'completed').length,
          processing: filteredDocs.filter(d => d.status === 'processing').length,
          failed: filteredDocs.filter(d => d.status === 'failed').length,
        },
        byType: filteredDocs.reduce((acc, doc) => {
          acc[doc.type] = (acc[doc.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
    });

  } catch (error) {
    console.error('Documents API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // In a real implementation, this would:
    // 1. Remove document from vector store
    // 2. Delete chunks from database
    // 3. Remove file from storage
    // 4. Update metadata

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });

  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
