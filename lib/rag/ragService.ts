import { DocumentRetriever } from './retrieveChunks';
import { ContextBuilder } from './buildContext';
import { PromptBuilder } from '../llm/buildPrompt';
import { getGeminiService } from '../llm/callGemini';
import { initializeVectorStore } from '../../vector-store';

export interface RAGQueryOptions {
  k?: number;
  includeSourceCitation?: boolean;
  responseStyle?: 'concise' | 'detailed' | 'conversational';
  filterBySource?: string[];
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  retrievalStrategy?: 'default' | 'diverse' | 'hybrid';
  contextStrategy?: 'default' | 'source-grouped' | 'question-specific';
  userId?: string;
}

export interface RAGResult {
  answer: string;
  sources: string[];
  chunks: number;
  confidence: number;
  retrievedChunks?: any[];
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class RAGService {
  private retriever: DocumentRetriever;
  private contextBuilder: ContextBuilder;
  private geminiService;
  private initialized = false;
  private lastRequestTime = 0;
  private minRequestInterval = 2000; // 2 seconds between requests

  constructor() {
    this.retriever = new DocumentRetriever();
    this.contextBuilder = new ContextBuilder();
    this.geminiService = getGeminiService();
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  async initialize(): Promise<void> {
    if (!this.initialized) {
      await initializeVectorStore();
      this.initialized = true;
    }
  }

  /**
   * Main RAG query method - Ask → Retrieve → Generate
   */
  async query(
    question: string, 
    options: RAGQueryOptions = {}
  ): Promise<RAGResult> {
    await this.initialize();

    const {
      k = 5,
      includeSourceCitation = true,
      responseStyle = 'detailed',
      filterBySource,
      temperature = 0.3,
      maxTokens = 1000,
      retrievalStrategy = 'default',
      contextStrategy = 'default',
      userId,
    } = options;

    try {
      // Step 1: Retrieve relevant documents
      console.log(`🔍 Retrieving documents for user ${userId || 'anonymous'}: "${question}"`);
      
      let retrievedChunks;
      switch (retrievalStrategy) {
        case 'diverse':
          retrievedChunks = await this.retriever.retrieveDiverseChunks(question, { 
            k, 
            filterBySource,
            userId 
          });
          break;
        case 'hybrid':
          retrievedChunks = await this.retriever.hybridSearch(question, { 
            k, 
            filterBySource,
            userId 
          });
          break;
        default:
          retrievedChunks = await this.retriever.retrieveChunks(question, { 
            k, 
            filterBySource,
            userId 
          });
      }

      if (retrievedChunks.length === 0) {
        return {
          answer: "I couldn't find any relevant information in the knowledge base to answer your question.",
          sources: [],
          chunks: 0,
          confidence: 0,
          retrievedChunks: [],
        };
      }

      console.log(`📚 Retrieved ${retrievedChunks.length} relevant chunks`);

      // Step 2: Build context from retrieved chunks
      let context;
      switch (contextStrategy) {
        case 'source-grouped':
          context = this.contextBuilder.buildContext(retrievedChunks, {
            separateBySource: true,
            includeMetadata: true,
            includeSources: true,
          });
          break;
        case 'question-specific':
          context = this.contextBuilder.buildQuestionSpecificContext(
            retrievedChunks, 
            question
          );
          break;
        default:
          context = this.contextBuilder.buildContext(retrievedChunks, {
            includeMetadata: true,
            includeSources: true,
          });
      }

      console.log(`📝 Built context with ${context.totalLength} characters from ${context.sources.length} sources`);

      // Step 3: Generate prompt for Gemini
      const prompt = PromptBuilder.buildRAGPrompt(question, context, {
        includeSourceCitation,
        responseStyle,
      });

      console.log(`🤖 Generating response with Gemini...`);

      // Step 4: Get response from Gemini (with rate limiting)
      await this.enforceRateLimit();
      const answer = await this.geminiService.generateText(prompt, {
        temperature,
        maxTokens,
      });

      // Calculate confidence based on top chunk score
      const confidence = retrievedChunks.length > 0 ? retrievedChunks[0].score : 0;

      console.log(`✅ Generated response with ${Math.round(confidence * 100)}% confidence`);

      return {
        answer,
        sources: context.sources,
        chunks: retrievedChunks.length,
        confidence,
        retrievedChunks: options.stream ? undefined : retrievedChunks, // Don't include chunks in streaming to save bandwidth
      };

    } catch (error) {
      console.error('Error in RAG query:', error);
      throw new Error(`RAG query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Streaming RAG query - returns a ReadableStream
   */
  async queryStream(
    question: string, 
    options: RAGQueryOptions = {}
  ): Promise<{ stream: ReadableStream<Uint8Array>; metadata: Omit<RAGResult, 'answer'> }> {
    await this.initialize();

    const {
      k = 5,
      includeSourceCitation = true,
      responseStyle = 'detailed',
      filterBySource,
      temperature = 0.3,
      maxTokens = 1000,
      retrievalStrategy = 'default',
      contextStrategy = 'default',
      userId,
    } = options;

    try {
      // Step 1 & 2: Retrieve and build context (same as query method)
      let retrievedChunks;
      switch (retrievalStrategy) {
        case 'diverse':
          retrievedChunks = await this.retriever.retrieveDiverseChunks(question, { k, filterBySource, userId });
          break;
        case 'hybrid':
          retrievedChunks = await this.retriever.hybridSearch(question, { k, filterBySource, userId });
          break;
        default:
          retrievedChunks = await this.retriever.retrieveChunks(question, { k, filterBySource, userId });
      }

      if (retrievedChunks.length === 0) {
        const errorStream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            const message = "I couldn't find any relevant information in the knowledge base to answer your question.";
            controller.enqueue(encoder.encode(message));
            controller.close();
          }
        });
        
        return {
          stream: errorStream,
          metadata: {
            sources: [],
            chunks: 0,
            confidence: 0,
          }
        };
      }

      let context;
      switch (contextStrategy) {
        case 'source-grouped':
          context = this.contextBuilder.buildContext(retrievedChunks, {
            separateBySource: true,
            includeMetadata: true,
            includeSources: true,
          });
          break;
        case 'question-specific':
          context = this.contextBuilder.buildQuestionSpecificContext(retrievedChunks, question);
          break;
        default:
          context = this.contextBuilder.buildContext(retrievedChunks, {
            includeMetadata: true,
            includeSources: true,
          });
      }

      const prompt = PromptBuilder.buildRAGPrompt(question, context, {
        includeSourceCitation,
        responseStyle,
      });

      // Step 3: Get streaming response from Gemini (with rate limiting)
      await this.enforceRateLimit();
      const stream = await this.geminiService.generateStream(prompt, {
        temperature,
        maxTokens,
      });

      const confidence = retrievedChunks.length > 0 ? retrievedChunks[0].score : 0;

      return {
        stream,
        metadata: {
          sources: context.sources,
          chunks: retrievedChunks.length,
          confidence,
        }
      };

    } catch (error) {
      console.error('Error in streaming RAG query:', error);
      throw new Error(`Streaming RAG query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * RAG query with conversation history
   */
  async queryWithHistory(
    question: string,
    conversationHistory: ConversationMessage[] = [],
    options: RAGQueryOptions = {}
  ): Promise<RAGResult> {
    await this.initialize();

    // For conversation with history, we still retrieve based on the current question
    // but provide the history context to the LLM
    const retrievalResult = await this.query(question, { ...options, stream: false });

    if (retrievalResult.chunks === 0) {
      return retrievalResult;
    }

    try {
      // Retrieve the context again for history-aware generation
      const retrievedChunks = await this.retriever.retrieveChunks(question, { 
        k: options.k || 5,
        filterBySource: options.filterBySource,
        userId: options.userId 
      });

      const context = this.contextBuilder.buildContext(retrievedChunks, {
        includeMetadata: true,
        includeSources: true,
      });

      // Build conversation history for Gemini
      const geminiHistory = conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'model' as const,
        parts: msg.content,
      }));

      // Add current context-aware prompt
      const contextPrompt = PromptBuilder.buildRAGPrompt(question, context, {
        includeSourceCitation: options.includeSourceCitation ?? true,
        responseStyle: options.responseStyle ?? 'detailed',
      });

      geminiHistory.push({
        role: 'user',
        parts: contextPrompt,
      });

      await this.enforceRateLimit();
      const answer = await this.geminiService.generateWithHistory(geminiHistory, {
        temperature: options.temperature || 0.3,
        maxTokens: options.maxTokens || 1000,
      });

      return {
        ...retrievalResult,
        answer,
      };

    } catch (error) {
      console.error('Error in RAG query with history:', error);
      throw new Error(`RAG query with history failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Health check method
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      await this.initialize();
      
      // Test retrieval
      const testChunks = await this.retriever.retrieveChunks('test query', { k: 1 });
      
      // Test Gemini connection
      await this.enforceRateLimit();
      await this.geminiService.generateText('Hello', { maxTokens: 10 });

      return {
        status: 'healthy',
        details: {
          vectorStore: 'connected',
          retrieval: 'working',
          gemini: 'connected',
          totalChunks: testChunks.length,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

// Singleton instance
let ragService: RAGService | null = null;

export function getRAGService(): RAGService {
  if (!ragService) {
    ragService = new RAGService();
  }
  return ragService;
}

// Convenience functions for direct use
export async function askRAG(
  question: string, 
  options?: RAGQueryOptions
): Promise<RAGResult> {
  const service = getRAGService();
  return service.query(question, options);
}

export async function askRAGStream(
  question: string, 
  options?: RAGQueryOptions
): Promise<{ stream: ReadableStream<Uint8Array>; metadata: Omit<RAGResult, 'answer'> }> {
  const service = getRAGService();
  return service.queryStream(question, options);
}

export async function askRAGWithHistory(
  question: string,
  history: ConversationMessage[],
  options?: RAGQueryOptions
): Promise<RAGResult> {
  const service = getRAGService();
  return service.queryWithHistory(question, history, options);
}
