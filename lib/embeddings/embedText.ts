import { GoogleGenerativeAI } from '@google/generative-ai';

export class EmbeddingService {
  private genai: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('Gemini API key is required');
    }
    
    this.genai = new GoogleGenerativeAI(key);
    this.model = this.genai.getGenerativeModel({ model: 'text-embedding-004' });
  }

  async embedText(text: string): Promise<number[]> {
    try {
      const result = await this.model.embedContent(text);
      return result.embedding.values;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error(`Failed to generate embeddings: ${error}`);
    }
  }

  async embedTexts(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const batchEmbeddings = await Promise.all(
        batch.map(text => this.embedText(text))
      );
      embeddings.push(...batchEmbeddings);
      
      // Add small delay between batches
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return embeddings;
  }

  async embedQuery(query: string): Promise<number[]> {
    return this.embedText(query);
  }
}

// Singleton instance
let embeddingService: EmbeddingService | null = null;

export function getEmbeddingService(): EmbeddingService {
  if (!embeddingService) {
    embeddingService = new EmbeddingService();
  }
  return embeddingService;
}
