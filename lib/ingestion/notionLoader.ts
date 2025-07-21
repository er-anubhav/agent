import { Document } from '@langchain/core/documents';
import { NotionAPILoader } from '@langchain/community/document_loaders/web/notionapi';

export interface NotionLoaderConfig {
  notionIntegrationToken: string;
  notionApiVersion?: string;
}

export class NotionLoader {
  private config: NotionLoaderConfig;

  constructor(config: NotionLoaderConfig) {
    this.config = config;
  }

  async loadPage(pageId: string, metadata?: Record<string, any>): Promise<Document[]> {
    try {
      const loader = new NotionAPILoader({
        clientOptions: {
          auth: this.config.notionIntegrationToken,
          notionVersion: this.config.notionApiVersion || '2022-06-28',
        },
        id: pageId,
        type: 'page',
      });

      const docs = await loader.load();
      
      return docs.map(doc => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          source: 'notion',
          pageId,
          ...metadata,
        },
      }));
    } catch (error) {
      console.error(`Failed to load Notion page ${pageId}:`, error);
      throw error;
    }
  }

  async loadDatabase(databaseId: string, metadata?: Record<string, any>): Promise<Document[]> {
    try {
      const loader = new NotionAPILoader({
        clientOptions: {
          auth: this.config.notionIntegrationToken,
          notionVersion: this.config.notionApiVersion || '2022-06-28',
        },
        id: databaseId,
        type: 'database',
      });

      const docs = await loader.load();
      
      return docs.map(doc => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          source: 'notion',
          databaseId,
          ...metadata,
        },
      }));
    } catch (error) {
      console.error(`Failed to load Notion database ${databaseId}:`, error);
      throw error;
    }
  }

  async loadMultiplePages(pageIds: string[], metadata?: Record<string, any>): Promise<Document[]> {
    const allDocs: Document[] = [];
    
    for (const pageId of pageIds) {
      try {
        const docs = await this.loadPage(pageId, metadata);
        allDocs.push(...docs);
        console.log(`Loaded ${docs.length} documents from Notion page ${pageId}`);
      } catch (error) {
        console.error(`Failed to load Notion page ${pageId}:`, error);
      }
    }
    
    return allDocs;
  }
}
