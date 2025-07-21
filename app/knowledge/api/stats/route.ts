import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }



    // Get real document stats from the database
    const { getDocumentsByUserId } = await import('@/lib/db/queries');
    const documents = await getDocumentsByUserId({ userId: session.user.id });
    const totalDocuments = documents.length;
    const recentUploads = documents.slice(0, 5).map(doc => ({
      id: doc.id,
      title: doc.title,
      status: 'completed', // You can adjust this if you track status
      uploadedAt: doc.createdAt
        ? new Date(doc.createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
        : '',
    }));

    // Get chunk count and vector store size
    const { getVectorStore } = await import('@/vector-store');
    const vectorStore = getVectorStore();
    let totalChunks = 0;
    let vectorStoreSize = 'N/A';
    try {
      const stats = await vectorStore.getStats();
      totalChunks = typeof stats.count === 'number' && stats.count >= 0 ? stats.count : 0;
      vectorStoreSize = stats.dimension ? `${stats.dimension} dims` : 'N/A';
    } catch (e) {
      // fallback if vector store not available
    }

    const overviewStats = {
      totalDocuments,
      totalChunks,
      vectorStoreSize,
      indexingStatus: 'idle',
      lastIndexed: documents[0]?.createdAt
        ? new Date(documents[0].createdAt).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
        : '',
      recentUploads,
    };

    return NextResponse.json(overviewStats);

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
