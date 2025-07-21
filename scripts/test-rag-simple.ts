/**
 * Simple RAG test with rate limit handling
 * Run with: npx tsx scripts/test-rag-simple.ts
 */

import { getRAGService, askRAG, askRAGStream } from '../lib/rag/ragService';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Helper function to add delay between requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function testRAGSimple() {
  console.log('🧪 Simple RAG Test (Rate Limit Friendly)...\n');

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

    // Test 1: Basic question
    console.log('1️⃣ Testing basic question...\n');
    const question1 = 'What are the system requirements?';
    console.log(`❓ Question: ${question1}`);
    
    try {
      const result = await askRAG(question1, {
        k: 3,
        responseStyle: 'detailed',
        retrievalStrategy: 'default',
      });

      console.log(`💡 Answer: ${result.answer}`);
      console.log(`📄 Sources: ${result.sources.join(', ')}`);
      console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`📚 Chunks used: ${result.chunks}\n`);
      
    } catch (error) {
      console.error(`❌ Error: ${error}\n`);
    }

    // Wait before next test
    console.log('⏳ Waiting 5 seconds to avoid rate limits...\n');
    await delay(5000);

    // Test 2: Different strategy
    console.log('2️⃣ Testing hybrid retrieval strategy...\n');
    const question2 = 'What benefits are available to employees?';
    console.log(`❓ Question: ${question2}`);
    
    try {
      const result = await askRAG(question2, {
        k: 3,
        retrievalStrategy: 'hybrid',
        responseStyle: 'concise',
      });
      
      console.log(`💡 Answer: ${result.answer}`);
      console.log(`📄 Sources: ${result.sources.join(', ')}`);
      console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`📚 Chunks used: ${result.chunks}\n`);
      
    } catch (error) {
      console.error(`❌ Error: ${error}\n`);
    }

    // Wait before next test
    console.log('⏳ Waiting 5 seconds to avoid rate limits...\n');
    await delay(5000);

    // Test 3: Streaming response
    console.log('3️⃣ Testing streaming response...\n');
    const question3 = 'How is authentication handled?';
    console.log(`❓ Streaming question: ${question3}`);
    console.log('💬 Streaming response:');
    
    try {
      const { stream, metadata } = await askRAGStream(question3, {
        k: 3,
        responseStyle: 'conversational',
      });

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        process.stdout.write(chunk);
        fullResponse += chunk;
      }

      console.log(`\n\n📄 Sources: ${metadata.sources.join(', ')}`);
      console.log(`📊 Confidence: ${(metadata.confidence * 100).toFixed(1)}%`);
      console.log(`📚 Chunks used: ${metadata.chunks}\n`);
      
    } catch (error) {
      console.error(`❌ Streaming error: ${error}\n`);
    }

    console.log('🎉 Simple RAG test completed successfully!');
    console.log('\n💡 Tips:');
    console.log('- For production, consider implementing request queuing');
    console.log('- Use paid Gemini API for higher rate limits');
    console.log('- Cache frequently asked questions to reduce API calls');

  } catch (error) {
    console.error('❌ Simple RAG test failed:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testRAGSimple().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}
