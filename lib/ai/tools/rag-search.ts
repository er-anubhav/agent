import { z } from 'zod';
import { tool, type UIMessageStreamWriter } from 'ai';
import { getRAGService } from '@/lib/rag/ragService';
import type { ChatMessage } from '@/lib/types';

interface RAGSearchProps {
  dataStream: UIMessageStreamWriter<ChatMessage>;
}

export const ragSearch = ({ dataStream }: RAGSearchProps) =>
  tool({
    description: 'Search through documents and knowledge base to answer questions with citations',
    inputSchema: z.object({
      query: z
        .string()
        .describe('The question or query to search for in the knowledge base'),
      includeSourceCitation: z
        .boolean()
        .optional()
        .describe('Whether to include source citations in the response'),
      responseStyle: z
        .enum(['concise', 'detailed', 'conversational'])
        .optional()
        .describe('The style of response to generate'),
      maxChunks: z
        .number()
        .min(1)
        .max(20)
        .optional()
        .describe('Maximum number of document chunks to retrieve (1-20)'),
    }),
    execute: async ({ 
      query, 
      includeSourceCitation = true, 
      responseStyle = 'detailed',
      maxChunks = 5 
    }) => {
      try {
        const ragService = getRAGService();
        
        // Check if RAG system is available
        const healthCheck = await ragService.healthCheck();
        if (healthCheck.status === 'unhealthy') {
          return {
            error: 'Knowledge base is currently unavailable. Please try again later.',
            sources: [],
            confidence: 0,
          };
        }

        // Perform RAG query
        const result = await ragService.query(query, {
          k: maxChunks,
          includeSourceCitation,
          responseStyle,
          retrievalStrategy: 'hybrid', // Use hybrid search for better results
          contextStrategy: 'source-grouped',
          temperature: 0.3, // More focused responses
        });

        // Stream the RAG data to UI
        dataStream.write({
          type: 'data-ragResult',
          data: {
            query,
            answer: result.answer,
            sources: result.sources,
            chunks: result.chunks,
            confidence: result.confidence,
          },
          transient: false, // Keep this data persistent
        });

        // Return structured result
        return {
          query,
          answer: result.answer,
          sources: result.sources,
          chunks: result.chunks,
          confidence: result.confidence,
          message: result.chunks > 0 
            ? `Found ${result.chunks} relevant sources with ${(result.confidence * 100).toFixed(1)}% confidence`
            : 'No relevant information found in the knowledge base',
        };

      } catch (error) {
        console.error('RAG search error:', error);
        
        return {
          error: 'Failed to search knowledge base. Please try rephrasing your question.',
          query,
          sources: [],
          confidence: 0,
        };
      }
    },
  });
