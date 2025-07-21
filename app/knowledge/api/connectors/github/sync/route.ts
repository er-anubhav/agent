import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { z } from 'zod';

const githubSyncSchema = z.object({
  accessToken: z.string(),
  repositories: z.array(z.object({
    owner: z.string(),
    repo: z.string(),
    branch: z.string().default('main'),
  })),
  syncSettings: z.object({
    includeReadme: z.boolean().default(true),
    includeWiki: z.boolean().default(true),
    includeMarkdownFiles: z.boolean().default(true),
    includeDocsFolders: z.boolean().default(true),
    autoSync: z.boolean().default(true),
    syncFrequency: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
  }).default({}),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accessToken, repositories, syncSettings } = githubSyncSchema.parse(body);

    // Import your existing ingestion pipeline
    const { DocumentIngestionPipeline } = await import('@/lib/ingestion/pipeline');
    
    const pipeline = new DocumentIngestionPipeline({
      chunkSize: 1000,
      chunkOverlap: 200,
      enableSectionAware: true,
    });

    const results = [];

    for (const repo of repositories) {
      try {
        const repoResults = await syncGitHubRepository(
          accessToken,
          repo.owner,
          repo.repo,
          repo.branch,
          syncSettings,
          pipeline,
          session.user.id
        );
        
        results.push(...repoResults);

      } catch (error) {
        console.error(`Error syncing repository ${repo.owner}/${repo.repo}:`, error);
        results.push({
          repository: `${repo.owner}/${repo.repo}`,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      message: `Synced ${successful.length} files successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      results,
      stats: {
        totalRepositories: repositories.length,
        totalFiles: results.length,
        successful: successful.length,
        failed: failed.length,
        syncSettings,
      },
    });

  } catch (error) {
    console.error('GitHub sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sync failed' 
      },
      { status: 500 }
    );
  }
}

async function syncGitHubRepository(
  accessToken: string,
  owner: string,
  repo: string,
  branch: string,
  syncSettings: any,
  pipeline: any,
  userId: string
): Promise<any[]> {
  const results = [];
  const baseUrl = `https://api.github.com/repos/${owner}/${repo}`;

  // 1. Sync README files
  if (syncSettings.includeReadme) {
    try {
      const readmeResponse = await fetch(`${baseUrl}/readme`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3.raw',
        },
      });

      if (readmeResponse.ok) {
        const readmeContent = await readmeResponse.text();
        
        await pipeline.ingestText([{
          content: readmeContent,
          source: `${owner}/${repo}/README.md`,
          metadata: {
            title: `${repo} - README`,
            repository: `${owner}/${repo}`,
            branch,
            type: 'readme',
            url: `https://github.com/${owner}/${repo}`,
            syncedBy: userId,
            syncedAt: new Date().toISOString(),
            connector: 'github',
          },
        }]);

        results.push({
          repository: `${owner}/${repo}`,
          file: 'README.md',
          success: true,
          contentLength: readmeContent.length,
        });
      }
    } catch (error) {
      console.error(`Error syncing README for ${owner}/${repo}:`, error);
    }
  }

  // 2. Sync markdown files if enabled
  if (syncSettings.includeMarkdownFiles || syncSettings.includeDocsFolders) {
    try {
      const treeResponse = await fetch(`${baseUrl}/git/trees/${branch}?recursive=1`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (treeResponse.ok) {
        const treeData = await treeResponse.json();
        
        // Filter for markdown files and docs folders
        const relevantFiles = treeData.tree.filter((item: any) => {
          if (item.type !== 'blob') return false;
          
          const path = item.path.toLowerCase();
          
          if (syncSettings.includeMarkdownFiles && path.endsWith('.md')) {
            return true;
          }
          
          if (syncSettings.includeDocsFolders && 
              (path.includes('/docs/') || path.startsWith('docs/') || 
               path.includes('/documentation/') || path.startsWith('documentation/'))) {
            return path.endsWith('.md') || path.endsWith('.txt');
          }
          
          return false;
        });

        // Sync each relevant file
        for (const file of relevantFiles.slice(0, 20)) { // Limit to 20 files per repo
          try {
            const fileResponse = await fetch(`${baseUrl}/contents/${file.path}?ref=${branch}`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3.raw',
              },
            });

            if (fileResponse.ok) {
              const fileContent = await fileResponse.text();
              
              await pipeline.ingestText([{
                content: fileContent,
                source: `${owner}/${repo}/${file.path}`,
                metadata: {
                  title: `${repo} - ${file.path}`,
                  repository: `${owner}/${repo}`,
                  branch,
                  filePath: file.path,
                  type: 'documentation',
                  url: `https://github.com/${owner}/${repo}/blob/${branch}/${file.path}`,
                  syncedBy: userId,
                  syncedAt: new Date().toISOString(),
                  connector: 'github',
                },
              }]);

              results.push({
                repository: `${owner}/${repo}`,
                file: file.path,
                success: true,
                contentLength: fileContent.length,
              });
            }
          } catch (error) {
            console.error(`Error syncing file ${file.path} from ${owner}/${repo}:`, error);
            results.push({
              repository: `${owner}/${repo}`,
              file: file.path,
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching tree for ${owner}/${repo}:`, error);
    }
  }

  // 3. Sync wiki if enabled (GitHub wikis are separate repos)
  if (syncSettings.includeWiki) {
    try {
      const wikiResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}.wiki/contents`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (wikiResponse.ok) {
        const wikiFiles = await wikiResponse.json();
        
        for (const wikiFile of wikiFiles.slice(0, 10)) { // Limit wiki files
          if (wikiFile.name.endsWith('.md')) {
            try {
              const wikiContentResponse = await fetch(wikiFile.download_url);
              if (wikiContentResponse.ok) {
                const wikiContent = await wikiContentResponse.text();
                
                await pipeline.ingestText([{
                  content: wikiContent,
                  source: `${owner}/${repo}/wiki/${wikiFile.name}`,
                  metadata: {
                    title: `${repo} Wiki - ${wikiFile.name}`,
                    repository: `${owner}/${repo}`,
                    type: 'wiki',
                    url: `https://github.com/${owner}/${repo}/wiki`,
                    syncedBy: userId,
                    syncedAt: new Date().toISOString(),
                    connector: 'github',
                  },
                }]);

                results.push({
                  repository: `${owner}/${repo}`,
                  file: `wiki/${wikiFile.name}`,
                  success: true,
                  contentLength: wikiContent.length,
                });
              }
            } catch (error) {
              console.error(`Error syncing wiki file ${wikiFile.name}:`, error);
            }
          }
        }
      }
    } catch (error) {
      // Wiki might not exist, which is fine
      console.log(`No wiki found for ${owner}/${repo}`);
    }
  }

  return results;
}
