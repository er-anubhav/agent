/**
 * Test script for the unified RAG service
 * Run with: npx tsx scripts/test-rag-service.ts
 */

import { getRAGService, askRAG, askRAGStream } from '../lib/rag/ragService';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const TEST_QUESTIONS = [
  'How many vacation days do employees get?',
  'What are the system requirements?',
  'What is the remote work policy?',
  'How is authentication handled in the API?',
  'What benefits are available to employees?',
];

// Helper function to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function testRAGService() {
  console.log('🧪 Testing Unified RAG Service...\n');

  try {
    // Check environment
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required. Please set it in .env.local');
    }

    const ragService = getRAGService();

    // Health check
    console.log('🏥 Performing health check...');
    const health = await ragService.healthCheck();
    console.log(`Health status: ${health.status}`);
    console.log('Health details:', JSON.stringify(health.details, null, 2));
    console.log();

    // Test basic queries
    console.log('1️⃣ Testing basic RAG queries...\n');
    
    for (let i = 0; i < TEST_QUESTIONS.length; i++) {
      const question = TEST_QUESTIONS[i];
      console.log(`❓ Question ${i + 1}: ${question}`);
      
      try {
        const result = await askRAG(question, {
          k: 3,
          responseStyle: 'concise',
          retrievalStrategy: 'default',
        });

        console.log(`💡 Answer: ${result.answer}`);
        console.log(`📄 Sources: ${result.sources.join(', ')}`);
        console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`📚 Chunks used: ${result.chunks}\n`);
        
        // Add delay to avoid rate limits
        if (i < TEST_QUESTIONS.length - 1) {
          console.log('⏳ Waiting 3 seconds to avoid rate limits...\n');
          await delay(3000);
        }
        
      } catch (error) {
        console.error(`❌ Error: ${error}\n`);
      }
    }

    // Test different retrieval strategies
    console.log('2️⃣ Testing different retrieval strategies...\n');
    const testQuestion = 'What policies does the company have?';
    
    const strategies = ['default', 'diverse', 'hybrid'] as const;
    for (const strategy of strategies) {
      console.log(`🔍 Testing ${strategy} retrieval strategy...`);
      try {
        const result = await askRAG(testQuestion, {
          k: 3,
          retrievalStrategy: strategy,
          responseStyle: 'concise',
        });
        
        console.log(`📊 ${strategy}: ${result.chunks} chunks, confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`📄 Sources: ${result.sources.join(', ')}`);
        console.log(`💡 Answer: ${result.answer.substring(0, 100)}...\n`);
        
        // Add delay between strategy tests
        console.log('⏳ Waiting 3 seconds to avoid rate limits...\n');
        await delay(3000);
        
      } catch (error) {
        console.error(`❌ Error with ${strategy}: ${error}\n`);
      }
    }

    // Test different context strategies
    console.log('3️⃣ Testing different context strategies...\n');
    
    const contextStrategies = ['default', 'source-grouped', 'question-specific'] as const;
    for (const contextStrategy of contextStrategies) {
      console.log(`📝 Testing ${contextStrategy} context strategy...`);
      try {
        const result = await askRAG(testQuestion, {
          k: 3,
          contextStrategy,
          responseStyle: 'concise',
        });
        
        console.log(`📊 ${contextStrategy}: ${result.chunks} chunks`);
        console.log(`💡 Answer: ${result.answer.substring(0, 100)}...\n`);
        
        // Add delay between context strategy tests
        console.log('⏳ Waiting 3 seconds to avoid rate limits...\n');
        await delay(3000);
        
      } catch (error) {
        console.error(`❌ Error with ${contextStrategy}: ${error}\n`);
      }
    }

    // Test streaming
    console.log('4️⃣ Testing streaming response...\n');
    const streamQuestion = 'What are the main benefits for employees?';
    
    try {
      console.log(`❓ Streaming question: ${streamQuestion}`);
      console.log('💬 Streaming response:');
      
      const { stream, metadata } = await askRAGStream(streamQuestion, {
        k: 3,
        responseStyle: 'detailed',
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        process.stdout.write(chunk);
        fullResponse += chunk;
      }

      console.log(`\n\n📄 Sources: ${metadata.sources.join(', ')}`);
      console.log(`📊 Confidence: ${(metadata.confidence * 100).toFixed(1)}%`);
      console.log(`📚 Chunks used: ${metadata.chunks}\n`);
      
      // Add delay before next test
      console.log('⏳ Waiting 5 seconds before testing conversation history...\n');
      await delay(5000);
      
    } catch (error) {
      console.error(`❌ Streaming error: ${error}\n`);
    }

    // Test conversation history
    console.log('5️⃣ Testing conversation with history...\n');
    
    try {
      const conversationHistory = [
        { role: 'user' as const, content: 'What are the system requirements?' },
        { role: 'assistant' as const, content: 'The system requirements are Node.js 18+, PostgreSQL 14+, Redis 6+, and minimum 8GB RAM.' },
      ];

      const followUpQuestion = 'What about the authentication method?';
      console.log(`❓ Follow-up question: ${followUpQuestion}`);
      
      const result = await ragService.queryWithHistory(followUpQuestion, conversationHistory, {
        k: 3,
        responseStyle: 'conversational',
      });

      console.log(`💡 Answer: ${result.answer}`);
      console.log(`📄 Sources: ${result.sources.join(', ')}`);
      console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%\n`);
      
    } catch (error) {
      console.error(`❌ Conversation error: ${error}\n`);
    }

    console.log('🎉 RAG Service test completed successfully!');

  } catch (error) {
    console.error('❌ RAG Service test failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testRAGService().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}
