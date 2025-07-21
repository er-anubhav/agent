import { DocumentLoader } from './documentLoader';
// Conditional imports for optional dependencies
let NotionLoader: any = null;
let GDocsLoader: any = null;
let SimpleGDocsLoader: any = null;

try {
  const notionModule = require('./notionLoader');
  NotionLoader = notionModule.NotionLoader;
} catch (error) {
  console.warn('Notion loader not available - install @notionhq/client to enable Notion integration');
}

try {
  const gdocsModule = require('./gdocsLoader');
  GDocsLoader = gdocsModule.GDocsLoader;
  SimpleGDocsLoader = gdocsModule.SimpleGDocsLoader;
} catch (error) {
  console.warn('Google Docs loader not available - some features may be limited');
}

import { DocumentChunker } from '../rag/chunkDocs';
import { getVectorStore } from '../../vector-store';
import { Document } from '@langchain/core/documents';

export interface IngestionConfig {
  chunkSize?: number;
  chunkOverlap?: number;
  batchSize?: number;
  enableSectionAware?: boolean;
  enableLLMFallback?: boolean;
}

export interface IngestionSource {
  type: 'file' | 'directory' | 'url' | 'notion' | 'gdocs' | 'text';
  path?: string;
  url?: string;
  pageId?: string;
  documentId?: string;
  text?: string;
  metadata?: Record<string, any>;
}

export class DocumentIngestionPipeline {
  private documentLoader: DocumentLoader;
  private notionLoader?: any;
  private gdocsLoader?: any;
  private simpleGDocsLoader?: any;
  private chunker: DocumentChunker;
  private vectorStore;

  constructor(config: IngestionConfig = {}) {
    this.documentLoader = new DocumentLoader();
    if (SimpleGDocsLoader) {
      this.simpleGDocsLoader = new SimpleGDocsLoader();
    }
    this.chunker = new DocumentChunker({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
    });
    this.vectorStore = getVectorStore();

    // Initialize optional loaders if API keys are available
    if (process.env.NOTION_INTEGRATION_TOKEN && NotionLoader) {
      this.notionLoader = new NotionLoader({
        notionIntegrationToken: process.env.NOTION_INTEGRATION_TOKEN,
      });
    }

    if (process.env.GOOGLE_DRIVE_API_KEY && GDocsLoader) {
      this.gdocsLoader = new GDocsLoader({
        googleDriveApiKey: process.env.GOOGLE_DRIVE_API_KEY,
      });
    }
  }

  private lastProcessedDocuments: Document[] = [];

  async ingest(sources: IngestionSource[], config: IngestionConfig = {}): Promise<void> {
    console.log(`Starting ingestion of ${sources.length} sources...`);
    
    try {
      // Initialize vector store
      await this.vectorStore.initialize();

      const allDocuments: Document[] = [];

      // Load documents from all sources
      const errors: Array<{ source: string; error: string }> = [];
      for (const source of sources) {
        try {
          const docs = await this.loadFromSource(source);
          // Filter out documents with empty pageContent
          const nonEmptyDocs = docs.filter(doc => doc.pageContent && doc.pageContent.trim().length > 0);
          allDocuments.push(...nonEmptyDocs);
          console.log(`Loaded ${nonEmptyDocs.length} non-empty documents from ${source.type} source (original: ${docs.length})`);
          // Collect extraction errors from metadata
          docs.forEach(doc => {
            if (doc.metadata?.extractionError) {
              errors.push({ source: doc.metadata.source || source.type, error: doc.metadata.extractionError });
            }
          });
        } catch (error: any) {
          errors.push({ source: source.path || source.text || 'unknown', error: error.message });
          console.error(`Failed to load from ${source.type} source:`, error);
        }
      }

      if (allDocuments.length === 0) {
        console.warn('No non-empty documents loaded, skipping ingestion');
        return;
      }

      // Chunk documents with section awareness
      console.log(`Chunking ${allDocuments.length} documents...`);
      const chunks = config.enableSectionAware !== false
        ? await this.chunker.chunkWithSections(allDocuments)
        : await this.chunker.chunkDocuments(allDocuments);

      console.log(`Created ${chunks.length} chunks`);

      // Store processed documents for content extraction
      this.lastProcessedDocuments = allDocuments;

      // Add to vector store in batches
      const batchSize = config.batchSize || 100;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        await this.vectorStore.addDocuments(batch);
        console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
      }

      // Save vector store
      await this.vectorStore.save();
      console.log('Ingestion completed successfully');
      if (errors.length) {
        console.warn('Ingestion errors:', errors);
        // Optionally, surface errors to the UI or logs
      }

    } catch (error) {
      console.error('Ingestion pipeline failed:', error);
      throw error;
    }
  }

  public async loadFromSource(source: IngestionSource): Promise<Document[]> {
    switch (source.type) {
      case 'file':
        if (!source.path) throw new Error('File path is required');
        return this.documentLoader.loadFromFile(source.path, source.metadata);

      case 'directory':
        if (!source.path) throw new Error('Directory path is required');
        return this.documentLoader.loadDirectory(source.path, source.metadata);

      case 'url':
        if (!source.url) throw new Error('URL is required');
        return this.documentLoader.loadFromUrl(source.url, source.metadata);

      case 'text':
        if (!source.text) throw new Error('Text content is required');
        const textSource = source.metadata?.source || 'text-input';
        return this.documentLoader.loadFromText(source.text, textSource, source.metadata);

      case 'notion':
        if (!this.notionLoader) throw new Error('Notion integration token not configured');
        if (!source.pageId) throw new Error('Notion page ID is required');
        return this.notionLoader.loadPage(source.pageId, source.metadata);

      case 'gdocs':
        if (source.url && this.simpleGDocsLoader) {
          // Use simple loader for public Google Docs
          return this.simpleGDocsLoader.loadPublicDocument(source.url, source.metadata);
        } else if (this.gdocsLoader && source.documentId) {
          // Use API loader for private documents
          return this.gdocsLoader.loadDocument(source.documentId, source.metadata);
        } else {
          throw new Error('Google Docs loader not available or URL/document ID is required');
        }

      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }
  }

  // Convenience methods for specific source types
  async ingestFiles(filePaths: string[], metadata?: Record<string, any>): Promise<void> {
    const sources: IngestionSource[] = filePaths.map(path => ({
      type: 'file',
      path,
      metadata,
    }));
    return this.ingest(sources);
  }

  async ingestDirectory(dirPath: string, metadata?: Record<string, any>): Promise<void> {
    const sources: IngestionSource[] = [{
      type: 'directory',
      path: dirPath,
      metadata,
    }];
    return this.ingest(sources);
  }

  async ingestUrls(urls: string[], metadata?: Record<string, any>): Promise<void> {
    const sources: IngestionSource[] = urls.map(url => ({
      type: 'url',
      url,
      metadata,
    }));
    return this.ingest(sources);
  }

  async ingestNotionPages(pageIds: string[], metadata?: Record<string, any>): Promise<void> {
    const sources: IngestionSource[] = pageIds.map(pageId => ({
      type: 'notion',
      pageId,
      metadata,
    }));
    return this.ingest(sources);
  }

  async ingestGoogleDocs(documentUrls: string[], metadata?: Record<string, any>): Promise<void> {
    const sources: IngestionSource[] = documentUrls.map(url => ({
      type: 'gdocs',
      url,
      metadata,
    }));
    return this.ingest(sources);
  }

  async ingestText(texts: Array<{ content: string; source: string; metadata?: Record<string, any> }>): Promise<void> {
    const sources: IngestionSource[] = texts.map(({ content, source, metadata }) => ({
      type: 'text',
      text: content,
      metadata: { ...metadata, source },
    }));
    return this.ingest(sources);
  }

  // Get ingestion statistics
  async getStats(): Promise<{ vectorStoreStats: any }> {
    const vectorStoreStats = await this.vectorStore.getStats();
    return { vectorStoreStats };
  }

  getProcessedContent(): string {
    if (!this.lastProcessedDocuments || this.lastProcessedDocuments.length === 0) {
      return '';
    }
    
    return this.lastProcessedDocuments
      .map(doc => doc.pageContent)
      .filter(content => content && content.trim().length > 0)
      .join('\n\n');
  }
}
