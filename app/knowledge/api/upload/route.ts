import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { z } from 'zod';

const uploadSchema = z.object({
  files: z.array(z.object({
    name: z.string(),
    type: z.string(),
    size: z.number(),
    content: z.string().optional(), // base64 encoded content
    url: z.string().optional(), // for URL imports
  })),
  config: z.object({
    chunkSize: z.number().default(1000),
    chunkOverlap: z.number().default(200),
    tags: z.array(z.string()).default([]),
  }).default({}),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { files, config } = uploadSchema.parse(body);

    // Import your existing ingestion pipeline
    const { DocumentIngestionPipeline } = await import('@/lib/ingestion/pipeline');
    
    // Process each file
    const results = await Promise.allSettled(
      files.map(async (file) => {
        try {
          let source: any;

          if (file.content) {
            // Check if it's a PDF file that needs special handling
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
              // For PDF files, save to temp file and use file processing path
              const fs = await import('fs/promises');
              const path = await import('path');
              const os = await import('os');
              
              const tempDir = os.tmpdir();
              const tempFileName = `temp_${Date.now()}_${file.name}`;
              const tempFilePath = path.join(tempDir, tempFileName);
              
              // Write PDF content to temp file
              const pdfBuffer = Buffer.from(file.content, 'base64');
              await fs.writeFile(tempFilePath, pdfBuffer);
              
              // Use file processing path which will use our multi-method extraction
              source = {
                type: 'file' as const,
                path: tempFilePath,
                metadata: {
                  fileName: file.name,
                  fileType: file.type,
                  fileSize: file.size,
                  uploadedBy: session.user.id,
                  uploadedAt: new Date().toISOString(),
                  tags: config.tags,
                  source: file.name,
                  tempFile: true, // Mark for cleanup
                },
              };
            } else {
              // Handle non-PDF content as text
              const content = Buffer.from(file.content, 'base64').toString('utf-8');
              source = {
                type: 'text' as const,
                text: content,
                metadata: {
                  fileName: file.name,
                  fileType: file.type,
                  fileSize: file.size,
                  uploadedBy: session.user.id,
                  uploadedAt: new Date().toISOString(),
                  tags: config.tags,
                  source: file.name,
                },
              };
            }
          } else if (file.url) {
            // Handle URL imports
            source = {
              type: 'url' as const,
              url: file.url,
              metadata: {
                fileName: file.name,
                fileType: file.type,
                uploadedBy: session.user.id,
                uploadedAt: new Date().toISOString(),
                tags: config.tags,
              },
            };
          } else {
            throw new Error('No content or URL provided for file');
          }

          // Use existing pipeline
          const pipeline = new DocumentIngestionPipeline({
            chunkSize: config.chunkSize,
            chunkOverlap: config.chunkOverlap,
            enableSectionAware: true,
          });

          // Ingest the document
          await pipeline.ingest([source], config);

          // Clean up temp file if it was created
          if (source.metadata?.tempFile && source.path) {
            try {
              const fs = await import('fs/promises');
              await fs.unlink(source.path);
            } catch (error) {
              console.warn('Failed to clean up temp file:', error);
            }
          }

          // Get stats to return information about the ingestion
          const stats = await pipeline.getStats();

          // Save document metadata to the database
          const { saveDocument } = await import('@/lib/db/queries');
          const docId = crypto.randomUUID();
          
          // Extract content from the processed documents
          let extractedText = '';
          if (source.text) {
            // If we have text, use it (should be valid UTF-8)
            extractedText = source.text;
            console.log('✅ Using source text content, length:', extractedText.length);
          } else {
            // For file-based processing (like PDFs), get content from pipeline
            extractedText = pipeline.getProcessedContent();
            console.log('✅ Extracted content from pipeline, length:', extractedText.length);
            if (extractedText.length > 0) {
              console.log('📄 Content preview:', extractedText.substring(0, 200) + '...');
            } else {
              console.log('❌ No content extracted from pipeline');
            }
          }
          
          // Ensure we have valid text content
          if (!extractedText || /%PDF-/.test(extractedText)) {
            console.log('⚠️ Setting fallback content - extracted text empty or contains PDF binary');
            extractedText = 'Content extraction failed.';
          } else {
            console.log('✅ Valid content found, length:', extractedText.length);
          }
          
          await saveDocument({
            id: docId,
            title: file.name,
            kind: 'text', // You may want to detect type
            content: typeof extractedText === 'string' ? extractedText : 'Content extraction failed.',
            userId: session.user.id,
            createdAt: new Date(),
          });

          return {
            fileName: file.name,
            success: true,
            message: 'Document ingested and saved successfully',
            metadata: source.metadata,
            stats,
            id: docId,
          };
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          return {
            fileName: file.name,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    const failed = results.filter(r => r.status === 'rejected' || !r.value.success);

    return NextResponse.json({
      success: true,
      message: `Processed ${successful.length} files successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'Processing failed' }),
      stats: {
        totalFiles: files.length,
        successful: successful.length,
        failed: failed.length,
      },
    });

  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Get upload history/status
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This would typically fetch from your database
    // For now, return mock data structure
    return NextResponse.json({
      uploads: [],
      stats: {
        totalUploads: 0,
        totalSize: 0,
        recentUploads: [],
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
