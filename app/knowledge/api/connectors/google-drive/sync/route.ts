import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { z } from 'zod';

const googleDriveSyncSchema = z.object({
  accessToken: z.string(),
  fileIds: z.array(z.string()),
  syncSettings: z.object({
    autoSync: z.boolean().default(true),
    syncFrequency: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
    includeComments: z.boolean().default(false),
  }).default({}),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accessToken, fileIds, syncSettings } = googleDriveSyncSchema.parse(body);

    // Import your existing ingestion pipeline
    const { DocumentIngestionPipeline } = await import('@/lib/ingestion/pipeline');
    
    const pipeline = new DocumentIngestionPipeline({
      chunkSize: 1000,
      chunkOverlap: 200,
      enableSectionAware: true,
    });

    const results = [];

    for (const fileId of fileIds) {
      try {
        // Get file metadata
        const metadataResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,modifiedTime,webViewLink,parents`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (!metadataResponse.ok) {
          throw new Error(`Failed to fetch metadata for file ${fileId}`);
        }

        const fileMetadata = await metadataResponse.json();

        // Download file content based on type
        let content = '';
        
        if (fileMetadata.mimeType === 'application/vnd.google-apps.document') {
          // Export Google Doc as plain text
          const exportResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );
          
          if (exportResponse.ok) {
            content = await exportResponse.text();
          }
        } else if (fileMetadata.mimeType === 'application/vnd.google-apps.presentation') {
          // Export Google Slides as plain text
          const exportResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );
          
          if (exportResponse.ok) {
            content = await exportResponse.text();
          }
        } else if (fileMetadata.mimeType === 'text/plain') {
          // Download plain text file
          const downloadResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
            }
          );
          
          if (downloadResponse.ok) {
            content = await downloadResponse.text();
          }
        } else {
          // For other file types, we'll skip content extraction for now
          // In a full implementation, you'd handle PDFs, DOCX, etc.
          content = `File: ${fileMetadata.name}\nType: ${fileMetadata.mimeType}\nThis file type is not yet supported for content extraction.`;
        }

        if (!content.trim()) {
          throw new Error('No content could be extracted from file');
        }

        // Create ingestion source
        const source = {
          metadata: {
            title: fileMetadata.name,
            url: fileMetadata.webViewLink,
            lastModified: fileMetadata.modifiedTime,
            googleDriveFileId: fileId,
            mimeType: fileMetadata.mimeType,
            size: fileMetadata.size,
            syncedBy: session.user.id,
            syncedAt: new Date().toISOString(),
            connector: 'google-drive',
          },
        };

        // Use the text ingestion method
        await pipeline.ingestText([{
          content: content,
          source: fileMetadata.name,
          metadata: source.metadata,
        }]);

        // Save document metadata to the database for display in documents list
        const { saveDocument } = await import('@/lib/db/queries');
        const docId = crypto.randomUUID();
        
        await saveDocument({
          id: docId,
          title: fileMetadata.name,
          kind: 'text',
          content: content,
          userId: session.user.id,
          createdAt: new Date(),
          source: 'google-drive',
          sourceMetadata: {
            fileId: fileId,
            mimeType: fileMetadata.mimeType,
            size: fileMetadata.size,
            createdTime: fileMetadata.createdTime,
            modifiedTime: fileMetadata.modifiedTime,
            webViewLink: fileMetadata.webViewLink,
            driveFileUrl: `https://drive.google.com/file/d/${fileId}/view`
          }
        });

        results.push({
          fileId,
          fileName: fileMetadata.name,
          success: true,
          contentLength: content.length,
          documentId: docId,
          source: 'google-drive',
        });

      } catch (error) {
        console.error(`Error syncing file ${fileId}:`, error);
        results.push({
          fileId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Store sync configuration for future automatic syncs
    // In a real implementation, you'd save this to your database

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      message: `Synced ${successful.length} files successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      results,
      stats: {
        totalFiles: fileIds.length,
        successful: successful.length,
        failed: failed.length,
        syncSettings,
      },
    });

  } catch (error) {
    console.error('Google Drive sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sync failed' 
      },
      { status: 500 }
    );
  }
}
