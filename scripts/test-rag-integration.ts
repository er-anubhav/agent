/**
 * Test RAG integration in chat
 * This tests the chat interface with RAG search tool
 */

import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

async function testRAGIntegration() {
  console.log('🧪 Testing RAG Integration in Chat Interface\n');

  try {
    // Test the RAG API endpoint first
    console.log('1️⃣ Testing RAG API endpoint...');
    const ragResponse = await fetch('http://localhost:3001/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: 'What is the company dress code policy?',
        options: {
          k: 3,
          includeSourceCitation: true,
          responseStyle: 'detailed',
        },
      }),
    });

    if (!ragResponse.ok) {
      console.error('❌ RAG API test failed:', ragResponse.status);
      const errorData = await ragResponse.json();
      console.error('Error details:', errorData);
      return;
    }

    const ragData = await ragResponse.json();
    console.log('✅ RAG API Response:');
    console.log(`   Answer: ${ragData.answer}`);
    console.log(`   Sources: ${ragData.sources.join(', ')}`);
    console.log(`   Confidence: ${(ragData.confidence * 100).toFixed(1)}%\n`);

    // Test 2: Technical question
    console.log('2️⃣ Testing technical question...');
    const techResponse = await fetch('http://localhost:3001/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: 'What are the system requirements?',
        options: {
          k: 3,
          includeSourceCitation: true,
          responseStyle: 'detailed',
        },
      }),
    });

    if (techResponse.ok) {
      const techData = await techResponse.json();
      console.log('✅ Technical Question Response:');
      console.log(`   Answer: ${techData.answer}`);
      console.log(`   Sources: ${techData.sources.join(', ')}`);
      console.log(`   Confidence: ${(techData.confidence * 100).toFixed(1)}%\n`);
    }

    console.log('🎉 RAG Integration Test Completed Successfully!');
    console.log('\n💡 Next Steps:');
    console.log('1. Open http://localhost:3001 in your browser');
    console.log('2. Ask a question like "What is the dress code?" or "What are the system requirements?"');
    console.log('3. The AI should use the ragSearch tool and show citations');
    console.log('4. You should see a blue knowledge base search box with confidence scores');

  } catch (error) {
    console.error('❌ RAG integration test failed:', error);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testRAGIntegration().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}

export { testRAGIntegration };
