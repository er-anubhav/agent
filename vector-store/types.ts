export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    source: string;
    section?: string;
    title?: string;
    page?: number;
    url?: string;
    timestamp?: Date;
    [key: string]: any;
  };
  embedding?: number[];
}

export interface VectorStoreConfig {
  dimension: number;
  indexType?: 'faiss' | 'qdrant';
  persistPath?: string;
}

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  distance: number;
}

export interface SearchOptions {
  userId?: string;
  filterBySource?: string[];
  threshold?: number;
}

export interface VectorStore {
  addDocuments(chunks: DocumentChunk[]): Promise<void>;
  search(query: string, k?: number, options?: SearchOptions): Promise<SearchResult[]>;
  similaritySearch(embedding: number[], k?: number, options?: SearchOptions): Promise<SearchResult[]>;
  save(): Promise<void>;
  load(): Promise<void>;
}
