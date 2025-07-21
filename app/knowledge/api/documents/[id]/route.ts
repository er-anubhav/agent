import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context;
  const { id: documentId } = await params;

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch real document from database
    const { getDocumentByIdAndUser } = await import('@/lib/db/queries');
    const doc = await getDocumentByIdAndUser({ id: documentId, userId: session.user.id });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    // Transform to frontend format
    const document = {
      id: doc.id,
      title: doc.title || 'Untitled Document',
      type: doc.kind || 'text',
      status: 'completed',
      uploadedAt: doc.createdAt.toISOString(),
      size: doc.content ? doc.content.length : 0,
      chunks: Math.ceil((doc.content?.length || 0) / 1000),
      metadata: {
        pages: doc.kind === 'text' ? Math.ceil((doc.content?.length || 0) / 2000) : undefined,
        language: 'en',
      },
      content: doc.content,
    };
    return NextResponse.json(document);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch document details' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = params.id;
    const body = await request.json();
    const { tags, name } = body;

    // In real implementation, update document metadata in database
    return NextResponse.json({
      success: true,
      message: 'Document updated successfully',
      document: {
        id: documentId,
        tags,
        name,
        updatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Update document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { params } = context;
  const { id: documentId } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Remove from database
    const { deleteDocumentByIdAndUser } = await import('@/lib/db/queries');
    const deleted = await deleteDocumentByIdAndUser({ id: documentId, userId: session.user.id });
    if (!deleted) {
      return NextResponse.json({ error: 'Document not found or not deleted' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
