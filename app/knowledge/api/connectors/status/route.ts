import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { document } from '@/lib/db/schema';

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get document counts by source
    const documentCounts = await db
      .select({
        source: document.source,
        count: sql<number>`count(*)::int`,
      })
      .from(document)
      .where(eq(document.userId, session.user.id))
      .groupBy(document.source);

    // Check for stored tokens (you'll need to implement token storage)
    const connectorStatus = {
      'google-drive': {
        isConnected: false,
        documentsCount: 0,
        lastSync: null,
      },
      'notion': {
        isConnected: false,
        documentsCount: 0,
        lastSync: null,
      },
      // GitHub and Web Crawler are coming soon, so we don't track their status yet
    };

    // Update counts from database
    for (const count of documentCounts) {
      if (count.source && connectorStatus[count.source as keyof typeof connectorStatus]) {
        connectorStatus[count.source as keyof typeof connectorStatus].documentsCount = count.count;
        // If we have documents, we consider it connected
        if (count.count > 0) {
          connectorStatus[count.source as keyof typeof connectorStatus].isConnected = true;
        }
      }
    }

    // Note: For client-side token checking (Google Drive, Notion), 
    // the frontend will need to check localStorage and update the display accordingly

    return NextResponse.json({
      success: true,
      connectors: connectorStatus,
    });

  } catch (error) {
    console.error('Error fetching connector status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch connector status' },
      { status: 500 }
    );
  }
}
