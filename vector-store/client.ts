import { PineconeStore } from '@langchain/pinecone';
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Document } from '@langchain/core/documents';
import { DocumentChunk, VectorStore, SearchResult, VectorStoreConfig, SearchOptions } from './types';

export class PineconeVectorStore implements VectorStore {
  private store: PineconeStore | null = null;
  private embeddings: GoogleGenerativeAIEmbeddings;
  private config: VectorStoreConfig;
  private pinecone: Pinecone;
  private indexName: string;

  constructor(config: VectorStoreConfig) {
    this.config = config;
    this.indexName = config.indexName || process.env.PINECONE_INDEX_NAME || 'default-index';
    
    // Check for required environment variables
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required for vector store embeddings');
    }
    
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY environment variable is required for Pinecone vector store');
    }
    
    // Initialize Pinecone client
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
    
    // Initialize Gemini embeddings
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'text-embedding-004', // Latest Gemini embedding model
    });
  }

  async initialize(): Promise<void> {
    try {
      // Get the Pinecone index
      const index = this.pinecone.index(this.indexName);
      
      // Initialize PineconeStore
      this.store = await PineconeStore.fromExistingIndex(this.embeddings, {
        pineconeIndex: index,
        namespace: this.config.namespace || 'default',
      });
      
      console.log(`Pinecone vector store initialized with index: ${this.indexName}`);
    } catch (error) {
      console.error('Failed to initialize Pinecone vector store:', error);
      throw error;
    }
  }

  async addDocuments(chunks: DocumentChunk[]): Promise<void> {
    if (!this.store) {
      await this.initialize();
    }

    const documents = chunks.map(chunk => 
      new Document({
        pageContent: chunk.content,
        metadata: {
          ...chunk.metadata,
          id: chunk.id,
        },
      })
    );

    await this.store!.addDocuments(documents);
    console.log(`Added ${chunks.length} document chunks to vector store`);
  }

  async search(query: string, k: number = 5, options: SearchOptions = {}): Promise<SearchResult[]> {
    if (!this.store) {
      await this.initialize();
    }

    const results = await this.store!.similaritySearchWithScore(query, k * 2); // Get more for filtering
    
    let filteredResults = results.map(([doc, score]) => ({
      chunk: {
        id: doc.metadata.id || 'unknown',
        content: doc.pageContent,
        metadata: {
          source: doc.metadata.source || 'unknown',
          section: doc.metadata.section,
          title: doc.metadata.title,
          page: doc.metadata.page,
          url: doc.metadata.url,
          timestamp: doc.metadata.timestamp,
          ...doc.metadata,
        },
      },
      score,
      distance: 1 - score, // Convert similarity to distance
    }));

    // Filter by user if specified
    if (options.userId) {
      filteredResults = filteredResults.filter((result) => 
        (result.chunk.metadata as any).uploadedBy === options.userId
      );
    }

    // Filter by source if specified
    if (options.filterBySource && options.filterBySource.length > 0) {
      filteredResults = filteredResults.filter((result) => 
        options.filterBySource!.includes(result.chunk.metadata.source)
      );
    }

    // Apply threshold if specified
    if (options.threshold !== undefined) {
      filteredResults = filteredResults.filter((result) => 
        result.score >= options.threshold!
      );
    }

    // Return only the requested number
    return filteredResults.slice(0, k);
  }

  async similaritySearch(embedding: number[], k: number = 5, options: SearchOptions = {}): Promise<SearchResult[]> {
    if (!this.store) {
      await this.initialize();
    }

    const results = await this.store!.similaritySearchVectorWithScore(embedding, k * 2);
    
    let filteredResults = results.map(([doc, score]: [Document, number]) => ({
      chunk: {
        id: doc.metadata.id || 'unknown',
        content: doc.pageContent,
        metadata: {
          source: doc.metadata.source || 'unknown',
          section: doc.metadata.section,
          title: doc.metadata.title,
          page: doc.metadata.page,
          url: doc.metadata.url,
          timestamp: doc.metadata.timestamp,
          ...doc.metadata,
        },
      },
      score,
      distance: 1 - score,
    }));

    // Filter by user if specified
    if (options.userId) {
      filteredResults = filteredResults.filter((result) => 
        (result.chunk.metadata as any).uploadedBy === options.userId
      );
    }

    // Filter by source if specified
    if (options.filterBySource && options.filterBySource.length > 0) {
      filteredResults = filteredResults.filter((result) => 
        options.filterBySource!.includes(result.chunk.metadata.source)
      );
    }

    // Apply threshold if specified
    if (options.threshold !== undefined) {
      filteredResults = filteredResults.filter((result: SearchResult) => 
        result.score >= options.threshold!
      );
    }

    return filteredResults.slice(0, k);
  }

  async save(): Promise<void> {
    // Pinecone automatically persists data, no explicit save needed
    console.log('Pinecone automatically persists data - no save operation required');
  }

  async load(): Promise<void> {
    // Pinecone data is always available, no explicit load needed
    await this.initialize();
    console.log('Pinecone data loaded from cloud index');
  }

  async getStats(): Promise<{ count: number; dimension: number }> {
    if (!this.store) {
      return { count: 0, dimension: this.config.dimension };
    }

    try {
      // Get index stats from Pinecone
      const index = this.pinecone.index(this.indexName);
      const stats = await index.describeIndexStats();
      
      return {
        count: stats.totalRecordCount || 0,
        dimension: this.config.dimension,
      };
    } catch (error) {
      console.warn('Could not get Pinecone stats:', error);
      return {
        count: -1, // Unknown
        dimension: this.config.dimension,
      };
    }
  }

  async deleteDocuments(ids: string[]): Promise<void> {
    if (!this.store) {
      await this.initialize();
    }

    try {
      const index = this.pinecone.index(this.indexName);
      await index.namespace(this.config.namespace || 'default').deleteMany(ids);
      console.log(`Deleted ${ids.length} documents from Pinecone`);
    } catch (error) {
      console.error('Failed to delete documents from Pinecone:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    if (!this.store) {
      await this.initialize();
    }

    try {
      const index = this.pinecone.index(this.indexName);
      await index.namespace(this.config.namespace || 'default').deleteAll();
      console.log('Cleared all documents from Pinecone namespace');
    } catch (error) {
      console.error('Failed to clear Pinecone namespace:', error);
      throw error;
    }
  }
}
