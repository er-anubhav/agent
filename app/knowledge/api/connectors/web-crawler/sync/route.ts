import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { z } from 'zod';

const webCrawlerSchema = z.object({
  urls: z.array(z.string().url()),
  crawlSettings: z.object({
    maxDepth: z.number().min(1).max(5).default(2),
    maxPages: z.number().min(1).max(100).default(10),
    respectRobotsTxt: z.boolean().default(true),
    includeExternalLinks: z.boolean().default(false),
    allowedDomains: z.array(z.string()).default([]),
    excludePatterns: z.array(z.string()).default([]),
    delay: z.number().min(100).max(5000).default(1000), // Delay between requests in ms
  }).default({}),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { urls, crawlSettings } = webCrawlerSchema.parse(body);

    // Import your existing ingestion pipeline
    const { DocumentIngestionPipeline } = await import('@/lib/ingestion/pipeline');
    
    const pipeline = new DocumentIngestionPipeline({
      chunkSize: 1000,
      chunkOverlap: 200,
      enableSectionAware: true,
    });

    const results = [];
    const visitedUrls = new Set<string>();
    const urlQueue: Array<{ url: string; depth: number }> = urls.map(url => ({ url, depth: 0 }));

    while (urlQueue.length > 0 && results.length < crawlSettings.maxPages) {
      const { url, depth } = urlQueue.shift()!;
      
      if (visitedUrls.has(url) || depth > crawlSettings.maxDepth) {
        continue;
      }

      visitedUrls.add(url);

      try {
        // Add delay between requests to be respectful
        if (results.length > 0) {
          await new Promise(resolve => setTimeout(resolve, crawlSettings.delay));
        }

        // Fetch the page
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Knowledge Base Crawler/1.0',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html')) {
          continue; // Skip non-HTML content
        }

        const html = await response.text();
        
        // Extract text content and links
        const { text, links } = extractContentAndLinks(html, url);
        
        if (text.trim().length < 100) {
          continue; // Skip pages with too little content
        }

        // Ingest the page content
        await pipeline.ingestText([{
          content: text,
          source: url,
          metadata: {
            title: extractTitle(html) || new URL(url).pathname,
            url,
            domain: new URL(url).hostname,
            crawledAt: new Date().toISOString(),
            crawledBy: session.user.id,
            depth,
            connector: 'web-crawler',
          },
        }]);

        results.push({
          url,
          title: extractTitle(html) || new URL(url).pathname,
          success: true,
          contentLength: text.length,
          depth,
        });

        // Add new links to queue if within depth limit
        if (depth < crawlSettings.maxDepth) {
          for (const link of links) {
            if (!visitedUrls.has(link) && shouldCrawlUrl(link, url, crawlSettings)) {
              urlQueue.push({ url: link, depth: depth + 1 });
            }
          }
        }

      } catch (error) {
        console.error(`Error crawling ${url}:`, error);
        results.push({
          url,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          depth,
        });
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      message: `Crawled ${successful.length} pages successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      results,
      stats: {
        totalUrls: urls.length,
        pagesProcessed: results.length,
        successful: successful.length,
        failed: failed.length,
        crawlSettings,
      },
    });

  } catch (error) {
    console.error('Web crawler error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Crawl failed' 
      },
      { status: 500 }
    );
  }
}

function extractContentAndLinks(html: string, baseUrl: string): { text: string; links: string[] } {
  // Simple HTML parsing - in production, you'd use a proper HTML parser like Cheerio
  
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Remove script and style tags
  let cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  
  // Extract text content (very basic)
  let text = cleanHtml.replace(/<[^>]+>/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();
  
  // Add title to content
  if (title) {
    text = `${title}\n\n${text}`;
  }

  // Extract links
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  const links: string[] = [];
  let match;
  
  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const url = new URL(match[1], baseUrl);
      links.push(url.toString());
    } catch (error) {
      // Invalid URL, skip
    }
  }

  return { text, links: [...new Set(links)] }; // Remove duplicates
}

function extractTitle(html: string): string | null {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : null;
}

function shouldCrawlUrl(url: string, baseUrl: string, settings: any): boolean {
  try {
    const urlObj = new URL(url);
    const baseUrlObj = new URL(baseUrl);

    // Check if external links are allowed
    if (!settings.includeExternalLinks && urlObj.hostname !== baseUrlObj.hostname) {
      return false;
    }

    // Check allowed domains
    if (settings.allowedDomains.length > 0) {
      const isAllowed = settings.allowedDomains.some((domain: string) => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
      if (!isAllowed) return false;
    }

    // Check exclude patterns
    if (settings.excludePatterns.length > 0) {
      const isExcluded = settings.excludePatterns.some((pattern: string) => 
        url.includes(pattern)
      );
      if (isExcluded) return false;
    }

    // Skip common non-content URLs
    const excludeExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.zip', '.exe'];
    const isFileUrl = excludeExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext));
    if (isFileUrl) return false;

    return true;
  } catch (error) {
    return false;
  }
}
