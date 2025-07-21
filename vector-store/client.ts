import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Document } from '@langchain/core/documents';
import fs from 'fs/promises';
import path from 'path';
import { DocumentChunk, VectorStore, SearchResult, VectorStoreConfig, SearchOptions } from './types';

export class FAISSVectorStore implements VectorStore {
  private store: FaissStore | null = null;
  private embeddings: GoogleGenerativeAIEmbeddings;
  private config: VectorStoreConfig;
  private indexPath: string;

  constructor(config: VectorStoreConfig) {
    this.config = config;
    this.indexPath = config.persistPath || path.join(process.cwd(), 'vector-store', 'faiss-index');
    
    // Check for required environment variables
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required for vector store embeddings');
    }
    
    // Initialize Gemini embeddings
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model: 'text-embedding-004', // Latest Gemini embedding model
    });
  }

  async initialize(): Promise<void> {
    try {
      await this.load();
    } catch (error) {
      console.log('No existing index found, creating new one...');
      // Create store with minimal documents that we'll immediately overwrite
      const emptyDocs = [new Document({ 
        pageContent: 'initialization document', 
        metadata: { id: 'init-doc', temporary: true } 
      })];
      this.store = await FaissStore.fromDocuments(emptyDocs, this.embeddings);
      console.log('New vector store created');
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
        id: doc.metadata.id,
        content: doc.pageContent,
        metadata: {
          ...doc.metadata,
          source: doc.metadata.source || 'unknown'
        },
      },
      score,
      distance: 1 - score, // Convert similarity to distance
    }));

    // Filter by user if specified
    if (options.userId) {
      filteredResults = filteredResults.filter((result: SearchResult) => 
        (result.chunk.metadata as any).uploadedBy === options.userId
      );
    }

    // Filter by source if specified
    if (options.filterBySource && options.filterBySource.length > 0) {
      filteredResults = filteredResults.filter((result: SearchResult) => 
        options.filterBySource!.includes(result.chunk.metadata.source)
      );
    }

    // Apply threshold if specified
    if (options.threshold !== undefined) {
      filteredResults = filteredResults.filter((result: SearchResult) => 
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
        id: doc.metadata.id,
        content: doc.pageContent,
        metadata: doc.metadata,
      },
      score,
      distance: 1 - score,
    }));

    // Filter by user if specified
    if (options.userId) {
      filteredResults = filteredResults.filter((result: SearchResult) => 
        (result.chunk.metadata as any).uploadedBy === options.userId
      );
    }

    // Filter by source if specified
    if (options.filterBySource && options.filterBySource.length > 0) {
      filteredResults = filteredResults.filter((result: SearchResult) => 
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
    if (!this.store) {
      throw new Error('Vector store not initialized');
    }

    // Ensure directory exists
    await fs.mkdir(path.dirname(this.indexPath), { recursive: true });
    
    await this.store.save(this.indexPath);
    console.log(`Vector store saved to ${this.indexPath}`);
  }

  async load(): Promise<void> {
    try {
      this.store = await FaissStore.load(this.indexPath, this.embeddings);
      console.log(`Vector store loaded from ${this.indexPath}`);
    } catch (error) {
      throw new Error(`Failed to load vector store: ${error}`);
    }
  }

  async getStats(): Promise<{ count: number; dimension: number }> {
    if (!this.store) {
      return { count: 0, dimension: this.config.dimension };
    }

    // FAISS doesn't expose count directly, so we'll estimate
    return {
      count: -1, // Unknown for FAISS
      dimension: this.config.dimension,
    };
  }
}
