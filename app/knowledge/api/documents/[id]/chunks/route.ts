import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = params.id;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Mock chunks data - in real implementation, fetch from vector database
    const allChunks = [
      {
        id: '1',
        documentId,
        content: 'This document outlines the requirements for the new AI-powered knowledge management system. The system will enable users to upload, organize, and query their documents using natural language processing.',
        startIndex: 85,
        endIndex: 289,
        metadata: { 
          page: 1, 
          section: 'Overview',
          chunkIndex: 0,
          tokens: 45,
          embedding: null, // Would contain actual embedding vector
        },
        createdAt: '2024-01-15T10:32:00Z',
      },
      {
        id: '2',
        documentId,
        content: 'Users should be able to upload documents in various formats (PDF, DOC, TXT, MD). Documents should be automatically processed and indexed. Users should be able to organize documents with tags and categories.',
        startIndex: 350,
        endIndex: 545,
        metadata: { 
          page: 1, 
          section: 'Functional Requirements', 
          heading: 'Document Management',
          chunkIndex: 1,
          tokens: 52,
          embedding: null,
        },
        createdAt: '2024-01-15T10:32:00Z',
      },
      {
        id: '3',
        documentId,
        content: 'Natural language search capabilities. Semantic search using vector embeddings. Filter and sort options. Search history and saved searches.',
        startIndex: 650,
        endIndex: 785,
        metadata: { 
          page: 1, 
          section: 'Functional Requirements', 
          heading: 'Search and Retrieval',
          chunkIndex: 2,
          tokens: 28,
          embedding: null,
        },
        createdAt: '2024-01-15T10:32:00Z',
      },
      {
        id: '4',
        documentId,
        content: 'RAG (Retrieval Augmented Generation) for Q&A. Document summarization. Content recommendations. Auto-tagging and categorization.',
        startIndex: 850,
        endIndex: 975,
        metadata: { 
          page: 1, 
          section: 'Functional Requirements', 
          heading: 'AI Integration',
          chunkIndex: 3,
          tokens: 25,
          embedding: null,
        },
        createdAt: '2024-01-15T10:32:00Z',
      },
      {
        id: '5',
        documentId,
        content: 'The system will follow a microservices architecture with the following components: Frontend: React/Next.js application, Backend: Node.js API server, Database: PostgreSQL for metadata, Vector DB for embeddings, AI/ML: OpenAI API for embeddings and completions.',
        startIndex: 1100,
        endIndex: 1350,
        metadata: { 
          page: 2, 
          section: 'Technical Requirements', 
          heading: 'Architecture',
          chunkIndex: 4,
          tokens: 65,
          embedding: null,
        },
        createdAt: '2024-01-15T10:32:00Z',
      },
    ];

    // Filter chunks based on search
    let filteredChunks = allChunks;
    if (search) {
      filteredChunks = allChunks.filter(chunk => 
        chunk.content.toLowerCase().includes(search.toLowerCase()) ||
        chunk.metadata.section?.toLowerCase().includes(search.toLowerCase()) ||
        chunk.metadata.heading?.toLowerCase().includes(search.toLowerCase())
      );
    }

    return NextResponse.json({
      chunks: filteredChunks,
      stats: {
        total: allChunks.length,
        filtered: filteredChunks.length,
        totalTokens: allChunks.reduce((sum, chunk) => sum + chunk.metadata.tokens, 0),
        avgTokensPerChunk: Math.round(allChunks.reduce((sum, chunk) => sum + chunk.metadata.tokens, 0) / allChunks.length),
      },
    });

  } catch (error) {
    console.error('Document chunks API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
