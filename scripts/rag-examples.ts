/**
 * Practical example of using the RAG service
 * This shows how to integrate RAG into your application
 */

import { getRAGService, askRAG, askRAGStream } from '../lib/rag/ragService';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Example 1: Simple question answering
export async function simpleQA() {
  console.log('📖 Example 1: Simple Question Answering\n');
  
  const question = "What are the system requirements for the application?";
  
  try {
    const result = await askRAG(question, {
      k: 3,
      responseStyle: 'detailed',
      includeSourceCitation: true,
    });

    console.log(`Q: ${question}`);
    console.log(`A: ${result.answer}`);
    console.log(`Sources: ${result.sources.join(', ')}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%\n`);
    
    return result;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Example 2: Streaming response for real-time UI
export async function streamingExample() {
  console.log('🌊 Example 2: Streaming Response for Real-time UI\n');
  
  const question = "What benefits does the company offer?";
  console.log(`Q: ${question}`);
  console.log('A: ');
  
  try {
    const { stream, metadata } = await askRAGStream(question, {
      k: 5,
      responseStyle: 'conversational',
      retrievalStrategy: 'diverse',
    });

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    // Simulate real-time typing effect
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      process.stdout.write(chunk);
      fullResponse += chunk;
      
      // Small delay to simulate typing
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    console.log(`\n\nMetadata:`);
    console.log(`- Sources: ${metadata.sources.join(', ')}`);
    console.log(`- Confidence: ${(metadata.confidence * 100).toFixed(1)}%`);
    console.log(`- Chunks: ${metadata.chunks}\n`);
    
    return { answer: fullResponse, metadata };
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Example 3: Advanced query with filters
export async function advancedQuery() {
  console.log('🔍 Example 3: Advanced Query with Filters\n');
  
  const question = "How should I configure the database?";
  
  try {
    const result = await askRAG(question, {
      k: 5,
      retrievalStrategy: 'hybrid',
      contextStrategy: 'source-grouped',
      responseStyle: 'detailed',
      filterBySource: ['technical-docs.md'], // Only search in technical docs
      temperature: 0.2, // More focused response
    });

    console.log(`Q: ${question}`);
    console.log(`A: ${result.answer}`);
    console.log(`Strategy: Hybrid retrieval + Source filtering`);
    console.log(`Sources: ${result.sources.join(', ')}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%\n`);
    
    return result;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Example 4: Conversation with context
export async function conversationExample() {
  console.log('💬 Example 4: Conversation with Context\n');
  
  const ragService = getRAGService();
  
  // Simulate a conversation
  const conversationHistory = [
    { role: 'user' as const, content: 'What are the system requirements?' },
    { 
      role: 'assistant' as const, 
      content: 'The system requirements are Node.js 18+, PostgreSQL 14+, Redis 6+, and minimum 8GB RAM.' 
    },
  ];

  const followUpQuestion = "What about the authentication setup?";
  
  try {
    console.log('Previous conversation:');
    conversationHistory.forEach(msg => {
      console.log(`${msg.role}: ${msg.content}`);
    });
    
    console.log(`\nuser: ${followUpQuestion}`);
    console.log('assistant: ');
    
    const result = await ragService.queryWithHistory(followUpQuestion, conversationHistory, {
      k: 3,
      responseStyle: 'conversational',
      temperature: 0.4,
    });

    console.log(result.answer);
    console.log(`\nSources: ${result.sources.join(', ')}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%\n`);
    
    return result;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

// Example 5: Error handling and fallbacks
export async function errorHandlingExample() {
  console.log('⚠️ Example 5: Error Handling and Fallbacks\n');
  
  const question = "What is the meaning of life, universe, and everything?";
  
  try {
    const result = await askRAG(question, {
      k: 5,
      responseStyle: 'detailed',
    });

    if (result.chunks === 0) {
      console.log(`Q: ${question}`);
      console.log('A: No relevant information found in the knowledge base.');
      console.log('Suggestion: Try a more specific question or check if relevant documents have been ingested.\n');
    } else {
      console.log(`Q: ${question}`);
      console.log(`A: ${result.answer}`);
      console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%\n`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error: ${error}`);
    console.log('Fallback: Please try again later or contact support.\n');
    return null;
  }
}

// Main function to run all examples
async function runAllExamples() {
  console.log('🚀 RAG Service Integration Examples\n');
  console.log('='.repeat(50) + '\n');

  try {
    await simpleQA();
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
    
    await streamingExample();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await advancedQuery();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await conversationExample();
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await errorHandlingExample();
    
    console.log('✅ All examples completed successfully!');
    console.log('\n💡 Integration Tips:');
    console.log('1. Use streaming for better user experience');
    console.log('2. Implement proper error handling and fallbacks');
    console.log('3. Cache frequent queries to reduce API calls');
    console.log('4. Use conversation history for multi-turn dialogs');
    console.log('5. Filter by source for domain-specific queries');
    
  } catch (error) {
    console.error('Examples failed:', error);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(error => {
    console.error('Examples failed:', error);
    process.exit(1);
  });
}
