// Simple Telegram Bot Test Script (Alternative to n8n)
// Use this if you want to test without setting up n8n first

const TelegramBot = require('node-telegram-bot-api');

// Replace with your bot token from @BotFather
const BOT_TOKEN = 'YOUR_BOT_TOKEN_HERE';
const BACKEND_URL = 'http://localhost:3000/api/bot/telegram';

// Create bot instance
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Telegram bot started!');
console.log('📝 To use this script:');
console.log('1. Replace BOT_TOKEN with your actual bot token');
console.log('2. Install dependencies: npm install node-telegram-bot-api');
console.log('3. Run: node simple-telegram-bot.js');

// Handle all text messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const messageText = msg.text;

  console.log(`📨 Message from ${msg.from.first_name}: ${messageText}`);

  try {
    // Send to our backend API
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        telegramUserId: userId.toString(),
        telegramChatId: chatId.toString(),
        message: messageText,
      }),
    });

    const result = await response.json();
    
    // Send reply back to user
    if (result.reply) {
      await bot.sendMessage(chatId, result.reply);
      console.log(`📤 Sent reply: ${result.reply.substring(0, 50)}...`);
    } else {
      await bot.sendMessage(chatId, '❌ Sorry, something went wrong.');
      console.log('❌ No reply received from backend');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    await bot.sendMessage(chatId, '❌ Sorry, I encountered an error. Please try again.');
  }
});

// Handle errors
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error);
});

console.log('✅ Bot is ready! Send messages to test.');

// Export for potential module use
module.exports = bot;
