import { NextRequest, NextResponse } from 'next/server';
import { DocumentIngestionPipeline, IngestionSource } from '../../../../lib/ingestion/pipeline';
import { auth } from '@/app/(auth)/auth';

export interface IngestionRequest {
  sources: IngestionSource[];
  config?: {
    chunkSize?: number;
    chunkOverlap?: number;
    batchSize?: number;
    enableSectionAware?: boolean;
    enableLLMFallback?: boolean;
  };
}

export interface IngestionResponse {
  success: boolean;
  message: string;
  stats?: {
    totalSources: number;
    vectorStoreStats: any;
  };
  errors?: string[];
  documents?: Array<{
    source: string;
    extractedText: string;
    extractionError: string | null;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in to ingest documents.' },
        { status: 401 }
      );
    }

    const body: IngestionRequest = await request.json();
    const { sources, config = {} } = body;

    if (!sources || !Array.isArray(sources) || sources.length === 0) {
      return NextResponse.json(
        { error: 'Sources array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate sources
    const validationErrors: string[] = [];
    sources.forEach((source, index) => {
      if (!source.type) {
        validationErrors.push(`Source ${index}: type is required`);
      }
      
      switch (source.type) {
        case 'file':
        case 'directory':
          if (!source.path) {
            validationErrors.push(`Source ${index}: path is required for ${source.type}`);
          }
          break;
        case 'url':
        case 'gdocs':
          if (!source.url) {
            validationErrors.push(`Source ${index}: url is required for ${source.type}`);
          }
          break;
        case 'notion':
          if (!source.pageId) {
            validationErrors.push(`Source ${index}: pageId is required for notion`);
          }
          break;
        case 'text':
          if (!source.text) {
            validationErrors.push(`Source ${index}: text is required for text type`);
          }
          break;
      }
    });

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation errors', details: validationErrors },
        { status: 400 }
      );
    }

    // Initialize ingestion pipeline
    const pipeline = new DocumentIngestionPipeline(config);

    // Add user metadata to all sources
    const userSources = sources.map(source => ({
      ...source,
      metadata: {
        ...source.metadata,
        uploadedBy: session.user.id,
        uploadedAt: new Date().toISOString(),
      }
    }));

    // Start ingestion and collect document extraction results
    console.log(`Starting ingestion of ${userSources.length} sources for user ${session.user.id}...`);
    const allDocuments: any[] = [];
    const errors: Array<{ source: string; error: string }> = [];
    for (const source of userSources) {
      try {
        const docs = await pipeline.loadFromSource(source);
        allDocuments.push(...docs);
        docs.forEach(doc => {
          if (doc.metadata?.extractionError) {
            errors.push({ source: doc.metadata.source || source.type, error: doc.metadata.extractionError });
          }
        });
      } catch (error: any) {
        errors.push({ source: source.path || source.text || 'unknown', error: error.message });
      }
    }

    // Ingest as before
    await pipeline.ingest(userSources, config);
    const stats = await pipeline.getStats();

    // Prepare document preview info
    const documents = allDocuments.map(doc => ({
      source: doc.metadata?.source,
      extractedText: doc.pageContent,
      extractionError: doc.metadata?.extractionError || null,
    }));

    const response: IngestionResponse = {
      success: true,
      message: `Successfully ingested ${userSources.length} sources`,
      stats: {
        totalSources: userSources.length,
        vectorStoreStats: stats.vectorStoreStats,
      },
      documents,
      errors: errors.map(e => `${e.source}: ${e.error}`),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Ingestion API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Ingestion failed', 
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined 
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check ingestion status and get stats
export async function GET() {
  try {
    const pipeline = new DocumentIngestionPipeline();
    const stats = await pipeline.getStats();
    
    return NextResponse.json({
      status: 'ready',
      supportedSources: ['file', 'directory', 'url', 'text', 'notion', 'gdocs'],
      stats,
      configuration: {
        defaultChunkSize: 1000,
        defaultChunkOverlap: 200,
        defaultBatchSize: 100,
        supportsSectionAware: true,
        enableLLMFallback: true,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        error: 'Failed to get ingestion status',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
