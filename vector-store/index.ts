import { PineconeVectorStore } from './client';
import { VectorStoreConfig } from './types';

// Default configuration for Pinecone vector store
const defaultConfig: VectorStoreConfig = {
  dimension: 768, // Gemini text-embedding-004 dimension
  indexType: 'pinecone',
  indexName: process.env.PINECONE_INDEX_NAME || 'chatbot-vectors',
  namespace: 'default',
};

// Singleton instance
let vectorStoreInstance: PineconeVectorStore | null = null;

export function getVectorStore(config?: Partial<VectorStoreConfig>): PineconeVectorStore {
  if (!vectorStoreInstance) {
    const finalConfig = { ...defaultConfig, ...config };
    vectorStoreInstance = new PineconeVectorStore(finalConfig);
  }
  return vectorStoreInstance;
}

export async function initializeVectorStore(config?: Partial<VectorStoreConfig>): Promise<PineconeVectorStore> {
  const store = getVectorStore(config);
  await store.initialize();
  return store;
}

export * from './types';
export * from './client';
