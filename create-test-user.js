// Create a test user for Telegram bot testing
const API_URL = 'http://localhost:3000';

async function createTestUser() {
  const userData = {
    email: 'testbot@example.com',
    password: 'testbot123'
  };

  console.log('🔧 Creating test user for Telegram bot...');
  console.log('📧 Email:', userData.email);
  console.log('🔑 Password:', userData.password);

  try {
    // Try to register the user
    const formData = new FormData();
    formData.append('email', userData.email);
    formData.append('password', userData.password);

    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      console.log('✅ Test user created successfully!');
      console.log('\n📱 You can now test the Telegram bot with:');
      console.log(`email: ${userData.email} password: ${userData.password}`);
      
      // Test authentication with the bot API
      await testBotAuth(userData);
    } else {
      console.log('⚠️  User might already exist or registration failed');
      console.log('📱 Try testing with existing credentials');
      
      // Test anyway in case user already exists
      await testBotAuth(userData);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testBotAuth(userData) {
  console.log('\n🤖 Testing bot authentication...');
  
  const authData = {
    telegramUserId: 'test123',
    telegramChatId: 'chat456',
    message: `email: ${userData.email} password: ${userData.password}`
  };

  try {
    const response = await fetch(`${API_URL}/api/bot/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authData),
    });

    const result = await response.json();
    console.log('📥 Bot Response:', result.reply);

    if (result.reply.includes('Welcome')) {
      console.log('✅ Authentication successful!');
      
      // Test a question
      await testBotQuestion();
    } else {
      console.log('❌ Authentication failed');
    }
  } catch (error) {
    console.error('❌ Error testing bot auth:', error.message);
  }
}

async function testBotQuestion() {
  console.log('\n💬 Testing bot question...');
  
  const questionData = {
    telegramUserId: 'test123',
    telegramChatId: 'chat456',
    message: 'What is artificial intelligence?'
  };

  try {
    const response = await fetch(`${API_URL}/api/bot/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questionData),
    });

    const result = await response.json();
    console.log('📥 Bot Answer:', result.reply);
    console.log('✅ Question test completed!');
  } catch (error) {
    console.error('❌ Error testing question:', error.message);
  }
}

// Run the test
createTestUser().catch(console.error);
