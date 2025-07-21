import { useState, useCallback } from 'react';
import useSWR from 'swr';

export interface RAGMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  confidence?: number;
  timestamp?: Date;
}

export interface RAGQueryOptions {
  k?: number;
  includeSourceCitation?: boolean;
  responseStyle?: 'concise' | 'detailed' | 'conversational';
  filterBySource?: string[];
  stream?: boolean;
}

export interface RAGResponse {
  answer: string;
  sources: string[];
  chunks: number;
  confidence?: number;
}

interface RAGState {
  isLoading: boolean;
  error: string | null;
  messages: RAGMessage[];
}

export function useRAG() {
  const [state, setState] = useState<RAGState>({
    isLoading: false,
    error: null,
    messages: [],
  });

  // Get RAG system status
  const { data: status, error: statusError } = useSWR(
    '/api/ask',
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error('RAG system not available');
      return response.json();
    },
    { refreshInterval: 30000 } // Check status every 30 seconds
  );

  const askQuestion = useCallback(async (
    question: string,
    options: RAGQueryOptions = {}
  ): Promise<RAGResponse | null> => {
    if (!question.trim()) {
      setState(prev => ({ ...prev, error: 'Question cannot be empty' }));
      return null;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      messages: [...prev.messages, { role: 'user', content: question, timestamp: new Date() }]
    }));

    try {
      const conversationHistory = state.messages.slice(-10); // Last 10 messages for context

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          options,
          conversationHistory: conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to access the knowledge base');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      const data: RAGResponse = await response.json();

      const assistantMessage: RAGMessage = {
        role: 'assistant',
        content: data.answer,
        sources: data.sources,
        confidence: data.confidence,
        timestamp: new Date(),
      };

      setState(prev => ({
        ...prev,
        isLoading: false,
        messages: [...prev.messages, assistantMessage],
      }));

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [state.messages]);

  const askQuestionStream = useCallback(async (
    question: string,
    options: RAGQueryOptions = {},
    onChunk?: (chunk: string) => void
  ): Promise<RAGResponse | null> => {
    if (!question.trim()) {
      setState(prev => ({ ...prev, error: 'Question cannot be empty' }));
      return null;
    }

    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      error: null,
      messages: [...prev.messages, { role: 'user', content: question, timestamp: new Date() }]
    }));

    try {
      const conversationHistory = state.messages.slice(-10);

      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          options: { ...options, stream: true },
          conversationHistory: conversationHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullAnswer = '';

      // Add placeholder message that will be updated
      const messageIndex = state.messages.length + 1;
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, { 
          role: 'assistant', 
          content: '', 
          timestamp: new Date() 
        }],
      }));

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullAnswer += chunk;

        // Update the last message with accumulated content
        setState(prev => ({
          ...prev,
          messages: prev.messages.map((msg, idx) => 
            idx === messageIndex ? { ...msg, content: fullAnswer } : msg
          ),
        }));

        onChunk?.(chunk);
      }

      setState(prev => ({ ...prev, isLoading: false }));

      return {
        answer: fullAnswer,
        sources: [], // Sources not available in streaming mode
        chunks: 0,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [state.messages]);

  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, messages: [], error: null }));
  }, []);

  const removeMessage = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      messages: prev.messages.filter((_, i) => i !== index),
    }));
  }, []);

  return {
    // State
    isLoading: state.isLoading,
    error: state.error,
    messages: state.messages,
    isAvailable: !!status && !statusError,
    status,

    // Actions
    askQuestion,
    askQuestionStream,
    clearMessages,
    removeMessage,
  };
}

// Hook for ingestion operations
export function useRAGIngestion() {
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestionError, setIngestionError] = useState<string | null>(null);

  const ingestDocuments = useCallback(async (
    sources: Array<{
      type: 'file' | 'directory' | 'url' | 'text' | 'notion' | 'gdocs';
      path?: string;
      url?: string;
      text?: string;
      pageId?: string;
      metadata?: Record<string, any>;
    }>,
    config: {
      chunkSize?: number;
      chunkOverlap?: number;
      batchSize?: number;
      enableSectionAware?: boolean;
    } = {}
  ) => {
    setIsIngesting(true);
    setIngestionError(null);

    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sources, config }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to ingest documents');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ingestion failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setIngestionError(errorMessage);
      throw error;
    } finally {
      setIsIngesting(false);
    }
  }, []);

  const getIngestionStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/ingest');
      if (!response.ok) throw new Error('Failed to get status');
      return response.json();
    } catch (error) {
      console.error('Failed to get ingestion status:', error);
      return null;
    }
  }, []);

  return {
    isIngesting,
    ingestionError,
    ingestDocuments,
    getIngestionStatus,
  };
}
