/**
 * Test the RAG API endpoint
 * Run with: npx tsx scripts/test-api.ts
 */

// Simple test to check if the API is working
async function testRAGAPI() {
  console.log('🧪 Testing RAG API Endpoint...\n');

  const API_BASE = 'http://localhost:3000';

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing health check...');
    const healthResponse = await fetch(`${API_BASE}/api/ask`);
    const healthData = await healthResponse.json();
    
    console.log('Health status:', healthData.status);
    console.log('Features:', JSON.stringify(healthData.features, null, 2));
    console.log();

    // Test 2: Simple query
    console.log('2️⃣ Testing simple query...');
    const queryResponse = await fetch(`${API_BASE}/api/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: 'What are the system requirements?',
        options: {
          k: 3,
          responseStyle: 'detailed',
          retrievalStrategy: 'default',
        },
      }),
    });

    if (!queryResponse.ok) {
      const errorData = await queryResponse.json();
      console.error('API Error:', errorData);
      return;
    }

    const queryData = await queryResponse.json();
    console.log('Question: What are the system requirements?');
    console.log('Answer:', queryData.answer);
    console.log('Sources:', queryData.sources);
    console.log('Confidence:', queryData.confidence);
    console.log('Chunks:', queryData.chunks);
    console.log();

    // Test 3: Streaming query
    console.log('3️⃣ Testing streaming query...');
    const streamResponse = await fetch(`${API_BASE}/api/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: 'What benefits are available to employees?',
        options: {
          k: 3,
          responseStyle: 'conversational',
          stream: true,
        },
      }),
    });

    if (!streamResponse.ok) {
      const errorData = await streamResponse.json();
      console.error('Streaming API Error:', errorData);
      return;
    }

    console.log('Question: What benefits are available to employees?');
    console.log('Streaming answer:');

    const reader = streamResponse.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        process.stdout.write(chunk);
        fullResponse += chunk;
      }
    }

    // Get metadata from headers
    const sources = streamResponse.headers.get('X-Sources');
    const chunks = streamResponse.headers.get('X-Chunks');
    const confidence = streamResponse.headers.get('X-Confidence');

    console.log('\n');
    if (sources) console.log('Sources:', JSON.parse(sources));
    if (chunks) console.log('Chunks:', chunks);
    if (confidence) console.log('Confidence:', confidence);
    console.log();

    console.log('🎉 API tests completed successfully!');

  } catch (error) {
    console.error('❌ API test failed:', error);
  }
}

// Wait a bit for the server to start, then run tests
setTimeout(() => {
  testRAGAPI().catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });
}, 3000); // Wait 3 seconds for server to start
