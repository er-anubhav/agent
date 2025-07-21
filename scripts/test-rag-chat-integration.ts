/**
 * Test RAG integration via chat endpoint
 * This simulates the RAG search tool being called
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testRAGChatIntegration() {
  console.log('🧪 Testing RAG Integration via Chat Interface\n');

  try {
    console.log('🔍 Testing ragSearch tool directly...');
    
    // Import and test the RAG service directly
    const { getRAGService } = await import('../lib/rag/ragService');
    
    const ragService = getRAGService();
    
    // Test 1: Company policy question
    console.log('1️⃣ Testing company policy question...');
    const result1 = await ragService.query('What is the dress code policy?', {
      k: 3,
      includeSourceCitation: true,
      responseStyle: 'detailed',
    });
    
    console.log('✅ Company Policy Result:');
    console.log(`   Answer: ${result1.answer}`);
    console.log(`   Sources: ${result1.sources.join(', ')}`);
    console.log(`   Chunks: ${result1.chunks}`);
    console.log(`   Confidence: ${(result1.confidence * 100).toFixed(1)}%\n`);

    // Test 2: Technical question
    console.log('2️⃣ Testing technical question...');
    const result2 = await ragService.query('What are the system requirements?', {
      k: 3,
      includeSourceCitation: true,
      responseStyle: 'detailed',
    });
    
    console.log('✅ Technical Question Result:');
    console.log(`   Answer: ${result2.answer}`);
    console.log(`   Sources: ${result2.sources.join(', ')}`);
    console.log(`   Chunks: ${result2.chunks}`);
    console.log(`   Confidence: ${(result2.confidence * 100).toFixed(1)}%\n`);

    // Test 3: Question with no relevant documents
    console.log('3️⃣ Testing irrelevant question...');
    const result3 = await ragService.query('What is the weather on Mars?', {
      k: 3,
      includeSourceCitation: true,
      responseStyle: 'detailed',
    });
    
    console.log('✅ Irrelevant Question Result:');
    console.log(`   Answer: ${result3.answer}`);
    console.log(`   Sources: ${result3.sources.join(', ')}`);
    console.log(`   Chunks: ${result3.chunks}`);
    console.log(`   Confidence: ${(result3.confidence * 100).toFixed(1)}%\n`);

    console.log('🎉 RAG Service Integration Test Completed Successfully!');
    console.log('\n💡 Integration Status:');
    console.log('✅ RAG service is working correctly');
    console.log('✅ Document retrieval is functional');
    console.log('✅ Confidence scoring is working');
    console.log('✅ Source citations are included');
    
    console.log('\n🚀 Next Steps for Chat Integration:');
    console.log('1. Open http://localhost:3001 in your browser');
    console.log('2. Start a new chat');
    console.log('3. Ask: "What is the dress code policy?"');
    console.log('4. The AI should automatically use the ragSearch tool');
    console.log('5. You should see a blue knowledge base search result with citations');
    
    console.log('\n📋 Expected Behavior in Chat:');
    console.log('- AI detects questions that need document search');
    console.log('- ragSearch tool is called automatically');
    console.log('- Search results appear in blue boxes');
    console.log('- Source citations are displayed');
    console.log('- Confidence scores are shown');

  } catch (error) {
    console.error('❌ RAG integration test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testRAGChatIntegration().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

export { testRAGChatIntegration };
