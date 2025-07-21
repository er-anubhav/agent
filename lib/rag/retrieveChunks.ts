import { getVectorStore } from '../../vector-store';
import { getEmbeddingService } from '../embeddings/embedText';
import { SearchResult } from '../../vector-store/types';

export interface RetrievalOptions {
  k?: number;
  threshold?: number;
  includeMetadata?: boolean;
  filterBySource?: string[];
  rerank?: boolean;
  userId?: string;
}

export class DocumentRetriever {
  private vectorStore;
  private embeddingService;

  constructor() {
    this.vectorStore = getVectorStore();
    this.embeddingService = getEmbeddingService();
  }

  async retrieveChunks(query: string, options: RetrievalOptions = {}): Promise<SearchResult[]> {
    const {
      k = 5,
      threshold = 0.7,
      includeMetadata = true,
      filterBySource,
      rerank = false,
      userId,
    } = options;

    try {
      // Get initial results from vector store with user filtering
      const searchOptions = {
        userId,
        filterBySource,
        threshold,
      };
      
      let results = await this.vectorStore.search(query, k * 2, searchOptions); // Get more than needed for reranking

      // Rerank if requested (simple implementation)
      if (rerank) {
        results = await this.rerankResults(query, results);
      }

      // Limit to requested number
      results = results.slice(0, k);

      // Remove metadata if not requested
      if (!includeMetadata) {
        results = results.map(result => ({
          ...result,
          chunk: {
            ...result.chunk,
            metadata: { source: result.chunk.metadata.source },
          },
        }));
      }

      return results;
    } catch (error) {
      console.error('Error retrieving chunks:', error);
      throw new Error(`Failed to retrieve chunks: ${error}`);
    }
  }

  async retrieveChunksByEmbedding(embedding: number[], options: RetrievalOptions = {}): Promise<SearchResult[]> {
    const {
      k = 5,
      threshold = 0.7,
      filterBySource,
      userId,
    } = options;

    try {
      const searchOptions = {
        userId,
        filterBySource,
        threshold,
      };
      
      let results = await this.vectorStore.similaritySearch(embedding, k * 2, searchOptions);

      return results.slice(0, k);
    } catch (error) {
      console.error('Error retrieving chunks by embedding:', error);
      throw new Error(`Failed to retrieve chunks by embedding: ${error}`);
    }
  }

  // Simple reranking based on query term overlap
  private async rerankResults(query: string, results: SearchResult[]): Promise<SearchResult[]> {
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    return results
      .map(result => {
        const content = result.chunk.content.toLowerCase();
        const termOverlap = queryTerms.filter(term => content.includes(term)).length;
        const rerankScore = (termOverlap / queryTerms.length) * 0.3 + result.score * 0.7;
        
        return {
          ...result,
          score: rerankScore,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  // Get diverse results (avoid too many chunks from same source)
  async retrieveDiverseChunks(query: string, options: RetrievalOptions = {}): Promise<SearchResult[]> {
    const { k = 5, userId } = options;
    const results = await this.retrieveChunks(query, { ...options, k: k * 3 });
    
    const diverseResults: SearchResult[] = [];
    const sourceCount: Record<string, number> = {};
    const maxPerSource = Math.max(1, Math.floor(k / 3));

    for (const result of results) {
      const source = result.chunk.metadata.source;
      const currentCount = sourceCount[source] || 0;

      if (currentCount < maxPerSource || diverseResults.length < k) {
        diverseResults.push(result);
        sourceCount[source] = currentCount + 1;

        if (diverseResults.length >= k) {
          break;
        }
      }
    }

    return diverseResults;
  }

  // Hybrid search combining vector similarity and keyword matching
  async hybridSearch(query: string, options: RetrievalOptions = {}): Promise<SearchResult[]> {
    const { k = 5, userId } = options;
    
    // Get vector search results
    const vectorResults = await this.retrieveChunks(query, { ...options, k: k * 2 });
    
    // Simple keyword search (in a real implementation, you'd use a proper search engine)
    const keywordResults = await this.keywordSearch(query, options);
    
    // Combine and deduplicate results
    const combinedResults = new Map<string, SearchResult>();
    
    // Add vector results with weight
    vectorResults.forEach((result, index) => {
      const score = result.score * 0.7 + (1 - index / vectorResults.length) * 0.3;
      combinedResults.set(result.chunk.id, { ...result, score });
    });
    
    // Add keyword results with weight
    keywordResults.forEach((result, index) => {
      const existing = combinedResults.get(result.chunk.id);
      if (existing) {
        // Combine scores
        const keywordScore = result.score * 0.3 + (1 - index / keywordResults.length) * 0.2;
        existing.score = existing.score + keywordScore;
      } else {
        const score = result.score * 0.3 + (1 - index / keywordResults.length) * 0.2;
        combinedResults.set(result.chunk.id, { ...result, score });
      }
    });
    
    // Sort by combined score and return top k
    return Array.from(combinedResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, k);
  }

  private async keywordSearch(query: string, options: RetrievalOptions = {}): Promise<SearchResult[]> {
    // This is a simplified implementation
    // In production, you'd want to use a proper search engine like Elasticsearch
    const allResults = await this.vectorStore.search('', 100); // Get many results for keyword filtering
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    return allResults
      .map(result => {
        const content = result.chunk.content.toLowerCase();
        const termMatches = queryTerms.filter(term => content.includes(term)).length;
        const keywordScore = termMatches / queryTerms.length;
        
        return {
          ...result,
          score: keywordScore,
        };
      })
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score);
  }
}
