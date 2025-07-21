import { NextRequest, NextResponse } from 'next/server';
import { getRAGService } from '../../../../lib/rag/ragService';
import { auth } from '@/app/(auth)/auth';

export interface RAGRequest {
  question: string;
  options?: {
    k?: number;
    includeSourceCitation?: boolean;
    responseStyle?: 'concise' | 'detailed' | 'conversational';
    filterBySource?: string[];
    stream?: boolean;
    temperature?: number;
    maxTokens?: number;
    retrievalStrategy?: 'default' | 'diverse' | 'hybrid';
    contextStrategy?: 'default' | 'source-grouped' | 'question-specific';
  };
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface RAGResponse {
  answer: string;
  sources: string[];
  chunks: number;
  confidence?: number;
  conversationId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to access the knowledge base.' },
        { status: 401 }
      );
    }

    const body: RAGRequest = await request.json();
    const { question, options = {}, conversationHistory = [] } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    // Check if required environment variables are set
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    const ragService = getRAGService();

    // Add user ID to options for user-specific knowledge base access
    const userSpecificOptions = {
      ...options,
      userId: session.user.id,
    };

    try {
      if (options.stream) {
        // Handle streaming response
        const result = await ragService.queryStream(question, {
          ...userSpecificOptions,
          stream: true,
        });

        // Return streaming response
        return new Response(result.stream, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'X-Sources': JSON.stringify(result.metadata.sources),
            'X-Chunks': result.metadata.chunks.toString(),
            'X-Confidence': result.metadata.confidence.toString(),
          },
        });
      } else {
        // Generate complete response
        let result;
        if (conversationHistory.length > 0) {
          result = await ragService.queryWithHistory(question, conversationHistory, userSpecificOptions);
        } else {
          result = await ragService.query(question, userSpecificOptions);
        }

        const response: RAGResponse = {
          answer: result.answer,
          sources: result.sources,
          chunks: result.chunks,
          confidence: result.confidence,
        };

        return NextResponse.json(response);
      }
    } catch (error) {
      console.error('RAG service error:', error);
      
      return NextResponse.json(
        { 
          error: 'Failed to process query', 
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined 
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('RAG API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined 
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check and stats
export async function GET() {
  try {
    const ragService = getRAGService();
    const healthCheck = await ragService.healthCheck();
    
    return NextResponse.json({
      status: healthCheck.status,
      ...healthCheck.details,
      features: {
        streaming: true,
        conversational: true,
        sourceFiltering: true,
        multipleResponseStyles: true,
        retrievalStrategies: ['default', 'diverse', 'hybrid'],
        contextStrategies: ['default', 'source-grouped', 'question-specific'],
      },
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'RAG service not available',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 503 }
    );
  }
}
