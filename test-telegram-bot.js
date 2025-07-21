// Test script for Telegram Bot API
const API_URL = 'http://localhost:3000/api/bot/telegram';

// Test data
const testData = {
  telegramUserId: 'test123',
  telegramChatId: 'chat456',
  message: 'Hello, I want to authenticate'
};

const authData = {
  telegramUserId: 'test123',
  telegramChatId: 'chat456',
  message: 'email: testbot@example.com password: testbot123'
};

const questionData = {
  telegramUserId: 'test123',
  telegramChatId: 'chat456',
  message: 'What is artificial intelligence?'
};

async function testAPI(data, testName) {
  console.log(`\n🧪 Testing: ${testName}`);
  console.log('📤 Request:', JSON.stringify(data, null, 2));
  
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    console.log('📥 Response:', JSON.stringify(result, null, 2));
    
    if (response.ok) {
      console.log('✅ Test passed');
    } else {
      console.log('❌ Test failed');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Telegram Bot API Tests...');
  
  // Test 1: Initial message (should ask for authentication)
  await testAPI(testData, 'Initial message without auth');
  
  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 2: Authentication (replace with real credentials)
  console.log('\n⚠️  Note: Update authData with real email/password to test authentication');
  await testAPI(authData, 'Authentication attempt');
  
  // Wait a bit between tests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Test 3: Help command
  await testAPI({
    ...testData,
    message: '/help'
  }, 'Help command');
  
  console.log('\n🏁 Tests completed!');
}

// Run the tests
runTests().catch(console.error);
