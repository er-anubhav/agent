import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { z } from 'zod';

const notionPagesSchema = z.object({
  accessToken: z.string(),
  cursor: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accessToken, cursor } = notionPagesSchema.parse(body);

    // Search for pages in the workspace
    const searchResponse = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        filter: {
          property: 'object',
          value: 'page'
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time'
        },
        page_size: 50,
        start_cursor: cursor,
      }),
    });

    if (!searchResponse.ok) {
      throw new Error('Failed to fetch pages from Notion');
    }

    const searchData = await searchResponse.json();

    // Also search for databases
    const databaseResponse = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        filter: {
          property: 'object',
          value: 'database'
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time'
        },
        page_size: 50,
      }),
    });

    let databases = [];
    if (databaseResponse.ok) {
      const databaseData = await databaseResponse.json();
      databases = databaseData.results;
    }

    // Format the results
    const formatNotionItem = (item: any) => {
      const title = item.properties?.title?.title?.[0]?.plain_text || 
                   item.properties?.Name?.title?.[0]?.plain_text ||
                   'Untitled';
      
      return {
        id: item.id,
        title,
        type: item.object,
        url: item.url,
        lastModified: item.last_edited_time,
        createdTime: item.created_time,
        icon: item.icon,
        cover: item.cover,
        archived: item.archived,
        parent: item.parent,
      };
    };

    const pages = searchData.results.map(formatNotionItem);
    const formattedDatabases = databases.map(formatNotionItem);

    return NextResponse.json({
      success: true,
      pages: [...pages, ...formattedDatabases],
      hasMore: searchData.has_more,
      nextCursor: searchData.next_cursor,
    });

  } catch (error) {
    console.error('Notion pages fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch pages' 
      },
      { status: 500 }
    );
  }
}
