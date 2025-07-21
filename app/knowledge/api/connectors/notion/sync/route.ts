import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { z } from 'zod';
import { randomUUID } from 'crypto';

const notionSyncSchema = z.object({
  accessToken: z.string(),
  pageIds: z.array(z.string()),
  syncSettings: z.object({
    autoSync: z.boolean().default(true),
    syncFrequency: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
    includeSubpages: z.boolean().default(true),
    includeDatabases: z.boolean().default(true),
  }).default({}),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accessToken, pageIds, syncSettings } = notionSyncSchema.parse(body);

    // Import your existing ingestion pipeline
    const { DocumentIngestionPipeline } = await import('@/lib/ingestion/pipeline');
    
    const pipeline = new DocumentIngestionPipeline({
      chunkSize: 1000,
      chunkOverlap: 200,
      enableSectionAware: true,
    });

    const results = [];

    for (const pageId of pageIds) {
      try {
        // Fetch page content
        const pageResponse = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Notion-Version': '2022-06-28',
          },
        });

        if (!pageResponse.ok) {
          throw new Error(`Failed to fetch page ${pageId}`);
        }

        const pageData = await pageResponse.json();

        // Fetch page content (blocks)
        const blocksResponse = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Notion-Version': '2022-06-28',
          },
        });

        if (!blocksResponse.ok) {
          throw new Error(`Failed to fetch blocks for page ${pageId}`);
        }

        const blocksData = await blocksResponse.json();

        // Convert Notion blocks to text
        const pageContent = extractTextFromBlocks(blocksData.results);
        const pageTitle = getPageTitle(pageData);

        // Create ingestion source
        const source = {
          type: 'notion' as const,
          pageId: pageId,
          metadata: {
            title: pageTitle,
            url: pageData.url,
            lastModified: pageData.last_edited_time,
            createdTime: pageData.created_time,
            notionPageId: pageId,
            syncedBy: session.user.id,
            syncedAt: new Date().toISOString(),
            connector: 'notion',
            icon: pageData.icon,
            cover: pageData.cover,
          },
        };

        // Use the text ingestion method since we have the content
        await pipeline.ingestText([{
          content: pageContent,
          source: pageTitle,
          metadata: source.metadata,
        }]);

        // Save document metadata to the database for display in documents list
        const { saveDocument } = await import('@/lib/db/queries');
        const docId = randomUUID();
        
        await saveDocument({
          id: docId,
          title: pageTitle,
          kind: 'text',
          content: pageContent,
          userId: session.user.id,
          createdAt: new Date(),
          source: 'notion',
          sourceMetadata: {
            pageId: pageId,
            url: pageData.url,
            lastModified: pageData.last_edited_time,
            createdTime: pageData.created_time,
            icon: pageData.icon,
            cover: pageData.cover,
            notionPageUrl: `https://notion.so/${pageId.replace(/-/g, '')}`
          }
        });

        results.push({
          pageId,
          title: pageTitle,
          success: true,
          contentLength: pageContent.length,
          documentId: docId,
          source: 'notion',
        });

      } catch (error) {
        console.error(`Error syncing page ${pageId}:`, error);
        results.push({
          pageId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Store sync configuration for future automatic syncs
    // In a real implementation, you'd save this to your database
    // with a scheduled job to run the sync based on syncSettings.syncFrequency

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      message: `Synced ${successful.length} pages successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      results,
      stats: {
        totalPages: pageIds.length,
        successful: successful.length,
        failed: failed.length,
        syncSettings,
      },
    });

  } catch (error) {
    console.error('Notion sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sync failed' 
      },
      { status: 500 }
    );
  }
}

// Helper function to extract text from Notion blocks
function extractTextFromBlocks(blocks: any[]): string {
  let text = '';

  for (const block of blocks) {
    switch (block.type) {
      case 'paragraph':
        text += extractRichText(block.paragraph.rich_text) + '\n\n';
        break;
      case 'heading_1':
        text += '# ' + extractRichText(block.heading_1.rich_text) + '\n\n';
        break;
      case 'heading_2':
        text += '## ' + extractRichText(block.heading_2.rich_text) + '\n\n';
        break;
      case 'heading_3':
        text += '### ' + extractRichText(block.heading_3.rich_text) + '\n\n';
        break;
      case 'bulleted_list_item':
        text += '- ' + extractRichText(block.bulleted_list_item.rich_text) + '\n';
        break;
      case 'numbered_list_item':
        text += '1. ' + extractRichText(block.numbered_list_item.rich_text) + '\n';
        break;
      case 'to_do':
        const checked = block.to_do.checked ? '[x]' : '[ ]';
        text += `${checked} ${extractRichText(block.to_do.rich_text)}\n`;
        break;
      case 'toggle':
        text += extractRichText(block.toggle.rich_text) + '\n';
        break;
      case 'quote':
        text += '> ' + extractRichText(block.quote.rich_text) + '\n\n';
        break;
      case 'code':
        text += '```\n' + extractRichText(block.code.rich_text) + '\n```\n\n';
        break;
      case 'callout':
        text += extractRichText(block.callout.rich_text) + '\n\n';
        break;
      // Add more block types as needed
    }
  }

  return text.trim();
}

// Helper function to extract plain text from Notion rich text
function extractRichText(richText: any[]): string {
  if (!richText) return '';
  return richText.map(text => text.plain_text).join('');
}

// Helper function to get page title
function getPageTitle(pageData: any): string {
  if (pageData.properties?.title?.title?.[0]?.plain_text) {
    return pageData.properties.title.title[0].plain_text;
  }
  if (pageData.properties?.Name?.title?.[0]?.plain_text) {
    return pageData.properties.Name.title[0].plain_text;
  }
  return 'Untitled';
}
