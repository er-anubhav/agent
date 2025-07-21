#!/usr/bin/env node

// Quick Setup Script for Telegram Bot
console.log('🤖 Telegram Bot Quick Setup\n');

const readline = require('readline');
const fs = require('fs');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setupBot() {
  console.log('This script will help you set up your Telegram bot quickly.\n');
  
  // Check if backend is running
  console.log('1️⃣ Checking if backend is running...');
  try {
    const response = await fetch('http://localhost:3000/api/bot/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        telegramUserId: 'test',
        telegramChatId: 'test', 
        message: 'test'
      })
    });
    
    if (response.ok) {
      console.log('✅ Backend is running!\n');
    } else {
      console.log('❌ Backend responded but might have issues\n');
    }
  } catch (error) {
    console.log('❌ Backend is not running! Please start it with: npm run dev\n');
    process.exit(1);
  }

  // Get bot token
  const token = await question('2️⃣ Enter your Telegram bot token (from @BotFather): ');
  
  if (!token || token.trim() === '') {
    console.log('❌ Bot token is required! Get one from @BotFather on Telegram');
    process.exit(1);
  }

  // Create test user
  console.log('\n3️⃣ Creating test user for authentication...');
  const email = await question('Enter test user email (default: testbot@example.com): ');
  const password = await question('Enter test user password (default: testbot123): ');
  
  const finalEmail = email.trim() || 'testbot@example.com';
  const finalPassword = password.trim() || 'testbot123';

  try {
    const userResponse = await fetch('http://localhost:3000/api/bot/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: finalEmail,
        password: finalPassword
      })
    });
    
    const result = await userResponse.json();
    console.log('✅ Test user ready!\n');
  } catch (error) {
    console.log('⚠️ User might already exist, that\'s okay!\n');
  }

  // Update bot script with token
  console.log('4️⃣ Configuring bot script...');
  
  let botScript = fs.readFileSync('simple-telegram-bot.js', 'utf8');
  botScript = botScript.replace('YOUR_BOT_TOKEN_HERE', token.trim());
  fs.writeFileSync('simple-telegram-bot.js', botScript);
  
  console.log('✅ Bot script configured!\n');

  // Install dependencies
  console.log('5️⃣ Installing Telegram bot dependencies...');
  
  return new Promise((resolve) => {
    exec('npm install node-telegram-bot-api', (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Failed to install dependencies. Please run: npm install node-telegram-bot-api');
      } else {
        console.log('✅ Dependencies installed!\n');
      }
      resolve();
    });
  });
}

async function showInstructions() {
  console.log('🎉 Setup Complete!\n');
  console.log('📱 How to test your bot:');
  console.log('1. Start the bot: npm run telegram:bot');
  console.log('2. Open Telegram and find your bot');
  console.log('3. Send a message to start authentication');
  console.log('4. Use: email: testbot@example.com password: testbot123');
  console.log('5. Ask questions and test commands like /help\n');
  
  console.log('🛠️ Alternative setup with n8n:');
  console.log('1. Install n8n: npm install n8n -g');
  console.log('2. Start n8n: n8n start');
  console.log('3. Import: n8n-telegram-bot-workflow.json');
  console.log('4. Configure your bot token in n8n\n');
  
  console.log('📚 For detailed instructions, see: TELEGRAM_BOT_SETUP.md');
  console.log('✨ Happy chatting with your AI assistant!\n');
}

async function main() {
  try {
    await setupBot();
    await showInstructions();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
  } finally {
    rl.close();
  }
}

main();
