#!/usr/bin/env node

/**
 * RAG Document Ingestion CLI
 * 
 * Usage examples:
 * npx tsx scripts/ingest.ts --files "path/to/doc.pdf" "path/to/doc2.txt"
 * npx tsx scripts/ingest.ts --directory "path/to/docs"
 * npx tsx scripts/ingest.ts --urls "https://example.com/doc" "https://example2.com"
 * npx tsx scripts/ingest.ts --notion-pages "page-id-1" "page-id-2"
 * npx tsx scripts/ingest.ts --gdocs "https://docs.google.com/document/d/doc-id/edit"
 */

import { DocumentIngestionPipeline, IngestionSource } from '../lib/ingestion/pipeline';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import path from 'path';

// Load environment variables
config({ path: '.env.local' });

interface CLIArgs {
  files?: string[];
  directory?: string;
  urls?: string[];
  notionPages?: string[];
  gdocs?: string[];
  text?: string;
  textFile?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  batchSize?: number;
  sectionAware?: boolean;
  help?: boolean;
}

function parseArgs(): CLIArgs {
  const args: CLIArgs = {};
  const argv = process.argv.slice(2);
  
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    
    switch (arg) {
      case '--files':
        args.files = [];
        while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
          args.files.push(argv[++i]);
        }
        break;
      case '--directory':
        args.directory = argv[++i];
        break;
      case '--urls':
        args.urls = [];
        while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
          args.urls.push(argv[++i]);
        }
        break;
      case '--notion-pages':
        args.notionPages = [];
        while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
          args.notionPages.push(argv[++i]);
        }
        break;
      case '--gdocs':
        args.gdocs = [];
        while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
          args.gdocs.push(argv[++i]);
        }
        break;
      case '--text':
        args.text = argv[++i];
        break;
      case '--text-file':
        args.textFile = argv[++i];
        break;
      case '--chunk-size':
        args.chunkSize = parseInt(argv[++i]);
        break;
      case '--chunk-overlap':
        args.chunkOverlap = parseInt(argv[++i]);
        break;
      case '--batch-size':
        args.batchSize = parseInt(argv[++i]);
        break;
      case '--section-aware':
        args.sectionAware = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
    }
  }
  
  return args;
}

function showHelp() {
  console.log(`
RAG Document Ingestion CLI

USAGE:
  npx tsx scripts/ingest.ts [OPTIONS]

OPTIONS:
  --files FILE1 FILE2 ...       Ingest specific files
  --directory DIR               Ingest all supported files in directory
  --urls URL1 URL2 ...          Ingest web pages
  --notion-pages ID1 ID2 ...    Ingest Notion pages (requires NOTION_INTEGRATION_TOKEN)
  --gdocs URL1 URL2 ...         Ingest Google Docs (public or with API key)
  --text "TEXT"                 Ingest raw text
  --text-file FILE              Ingest text from file
  
  --chunk-size SIZE             Chunk size in characters (default: 1000)
  --chunk-overlap OVERLAP       Chunk overlap in characters (default: 200)
  --batch-size SIZE             Batch size for processing (default: 100)
  --section-aware               Enable section-aware chunking
  
  --help, -h                    Show this help

ENVIRONMENT VARIABLES:
  GEMINI_API_KEY               Required for embeddings
  NOTION_INTEGRATION_TOKEN     Required for Notion integration
  GOOGLE_DRIVE_API_KEY         Optional for private Google Docs

EXAMPLES:
  npx tsx scripts/ingest.ts --files "docs/manual.pdf" "docs/guide.txt"
  npx tsx scripts/ingest.ts --directory "docs" --section-aware
  npx tsx scripts/ingest.ts --urls "https://example.com/help"
  npx tsx scripts/ingest.ts --notion-pages "page-id-123"
  npx tsx scripts/ingest.ts --text "This is some important information to index"
`);
}

async function main() {
  const args = parseArgs();
  
  if (args.help) {
    showHelp();
    process.exit(0);
  }

  // Check if Gemini API key is set
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY environment variable is required');
    console.error('Please set it in your .env.local file');
    process.exit(1);
  }

  // Build sources array
  const sources: IngestionSource[] = [];

  if (args.files && args.files.length > 0) {
    sources.push(...args.files.map(filePath => ({
      type: 'file' as const,
      path: path.resolve(filePath),
      metadata: { ingestionDate: new Date().toISOString() },
    })));
  }

  if (args.directory) {
    sources.push({
      type: 'directory',
      path: path.resolve(args.directory),
      metadata: { ingestionDate: new Date().toISOString() },
    });
  }

  if (args.urls && args.urls.length > 0) {
    sources.push(...args.urls.map(url => ({
      type: 'url' as const,
      url,
      metadata: { ingestionDate: new Date().toISOString() },
    })));
  }

  if (args.notionPages && args.notionPages.length > 0) {
    if (!process.env.NOTION_INTEGRATION_TOKEN) {
      console.error('❌ NOTION_INTEGRATION_TOKEN is required for Notion integration');
      process.exit(1);
    }
    sources.push(...args.notionPages.map(pageId => ({
      type: 'notion' as const,
      pageId,
      metadata: { ingestionDate: new Date().toISOString() },
    })));
  }

  if (args.gdocs && args.gdocs.length > 0) {
    sources.push(...args.gdocs.map(url => ({
      type: 'gdocs' as const,
      url,
      metadata: { ingestionDate: new Date().toISOString() },
    })));
  }

  if (args.text) {
    sources.push({
      type: 'text',
      text: args.text,
      metadata: { 
        source: 'cli-text-input',
        ingestionDate: new Date().toISOString() 
      },
    });
  }

  if (args.textFile) {
    try {
      const text = readFileSync(path.resolve(args.textFile), 'utf-8');
      sources.push({
        type: 'text',
        text,
        metadata: { 
          source: path.basename(args.textFile),
          ingestionDate: new Date().toISOString() 
        },
      });
    } catch (error) {
      console.error(`❌ Failed to read text file: ${args.textFile}`);
      console.error(error);
      process.exit(1);
    }
  }

  if (sources.length === 0) {
    console.error('❌ No sources specified. Use --help for usage information.');
    process.exit(1);
  }

  // Configure ingestion
  const config = {
    chunkSize: args.chunkSize || 1000,
    chunkOverlap: args.chunkOverlap || 200,
    batchSize: args.batchSize || 100,
    enableSectionAware: args.sectionAware || false,
  };

  console.log(`🚀 Starting ingestion of ${sources.length} source(s)...`);
  console.log(`📊 Config: chunk size ${config.chunkSize}, overlap ${config.chunkOverlap}, batch size ${config.batchSize}`);
  if (config.enableSectionAware) {
    console.log('📝 Section-aware chunking enabled');
  }

  try {
    const pipeline = new DocumentIngestionPipeline(config);
    
    const startTime = Date.now();
    await pipeline.ingest(sources, config);
    const endTime = Date.now();
    
    const stats = await pipeline.getStats();
    
    console.log('✅ Ingestion completed successfully!');
    console.log(`⏱️  Time taken: ${((endTime - startTime) / 1000).toFixed(2)} seconds`);
    console.log('📈 Statistics:', stats);
    
  } catch (error) {
    console.error('❌ Ingestion failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the CLI
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error:');
    console.error(error);
    process.exit(1);
  });
}
