import { FAISSVectorStore } from './client';
import { VectorStoreConfig } from './types';

// Default configuration for FAISS vector store
const defaultConfig: VectorStoreConfig = {
  dimension: 768, // Gemini embedding dimension
  indexType: 'faiss',
  persistPath: process.env.VECTOR_STORE_PATH || undefined,
};

// Singleton instance
let vectorStoreInstance: FAISSVectorStore | null = null;

export function getVectorStore(config?: Partial<VectorStoreConfig>): FAISSVectorStore {
  if (!vectorStoreInstance) {
    const finalConfig = { ...defaultConfig, ...config };
    vectorStoreInstance = new FAISSVectorStore(finalConfig);
  }
  return vectorStoreInstance;
}

export async function initializeVectorStore(config?: Partial<VectorStoreConfig>): Promise<FAISSVectorStore> {
  const store = getVectorStore(config);
  await store.initialize();
  return store;
}

export * from './types';
export * from './client';
