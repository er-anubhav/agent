# Telegram Bot Setup Guide

This guide will help you set up a Telegram bot connected to your AI assistant backend using n8n.

## Prerequisites

- ✅ Your backend API is running (completed in Step 2)
- ✅ n8n installed and running
- ✅ Telegram account

## Step 1: Create a Telegram Bot

1. **Open Telegram** and search for `@BotFather`
2. **Start a chat** with BotFather and send `/newbot`
3. **Choose a name** for your bot (e.g., "My AI Assistant")
4. **Choose a username** for your bot (must end with 'bot', e.g., "myaiassistant_bot")
5. **Save the bot token** - you'll need this for n8n

Example interaction:
```
You: /newbot
BotFather: Alright, a new bot. How are we going to call it?
You: My AI Assistant
BotFather: Good. Now let's choose a username for your bot.
You: myaiassistant_bot
BotFather: Done! Congratulations on your new bot.
```

## Step 2: Configure n8n

### Install n8n (if not already installed)
```bash
npm install n8n -g
# or
npx n8n
```

### Start n8n
```bash
n8n start
```
n8n will be available at http://localhost:5678

## Step 3: Import the Workflow

1. **Open n8n** in your browser (http://localhost:5678)
2. **Click "Import workflow"**
3. **Upload** the `n8n-telegram-bot-workflow-fixed.json` file (use the FIXED version!)
4. **Save** the workflow

> ⚠️ **Important**: Use the `n8n-telegram-bot-workflow-fixed.json` file, not the regular one. The fixed version has proper JSON body configuration.

## Step 4: Configure Telegram Credentials

1. **In n8n**, click on the "Telegram Bot Trigger" node
2. **Click "Create New Credential"**
3. **Enter your bot token** from Step 1
4. **Test the connection**
5. **Save the credential**

## Step 5: Update Backend URL (if needed)

If your backend is not running on localhost:3000, update the HTTP Request node:

1. **Click on "Process Message" node**
2. **Update the URL** from `http://localhost:3000/api/bot/telegram` to your actual URL
3. **Save** the workflow

## Step 6: Activate the Workflow

1. **Click the toggle** in the top-right corner to activate the workflow
2. **The workflow should show as "Active"**

## Step 7: Test Your Bot

1. **Open Telegram** and find your bot by username
2. **Start a chat** with your bot
3. **Send a message** like "Hello"
4. **You should get** an authentication prompt

### Test Authentication Flow

1. **Send**: `email: testbot@example.com password: testbot123`
2. **You should get**: "✅ Welcome testbot@example.com!"
3. **Ask a question**: "What is artificial intelligence?"
4. **You should get**: An AI-powered response

### Test Bot Commands

- `/help` - Show available commands
- `/status` - Check authentication status  
- `/logout` - Sign out
- `/history` - View recent conversations

## Troubleshooting

### Bot returning "Invalid JSON format"?
- **Delete your current workflow** in n8n
- **Import the FIXED workflow**: `n8n-telegram-bot-workflow-fixed.json`
- **Make sure** the "Process Message" node uses proper JSON body format
- **Update the URL** to `http://192.168.20.126:3000/api/bot/telegram` (not localhost)

### Bot not responding?
- Check n8n workflow is active
- Verify bot token is correct
- Check backend server is running on correct URL

### Authentication failing?
- Verify user exists: `POST http://localhost:3000/api/bot/create-user`
- Check email/password format: `email: your@email.com password: yourpassword`

### Can't create users?
Use the create-user endpoint:
```bash
curl -X POST http://localhost:3000/api/bot/create-user \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

## Advanced Configuration

### Production Deployment

1. **Update n8n HTTP Request URL** to your production domain
2. **Set up proper SSL/HTTPS** for your backend
3. **Configure webhooks** instead of polling (optional)

### Multiple Users

Each user needs to:
1. **Register** an account on your platform
2. **Authenticate** through the bot using their credentials
3. **Use the bot** with their personal knowledge base

### Customization

You can modify the workflow to:
- Add custom commands
- Integrate with other services
- Add logging and analytics
- Implement user permissions

## Security Notes

- ✅ User credentials are verified against your database
- ✅ Sessions timeout after 30 minutes
- ✅ Each user only accesses their own data
- ✅ Bot API is protected by middleware

## Next Steps

Once your bot is working:
- Share the bot username with users
- Monitor usage in n8n execution logs
- Consider upgrading to n8n Cloud for production use
- Add more AI features to your backend

## Support

If you encounter issues:
1. Check n8n execution logs
2. Check your backend server logs
3. Verify all credentials are correct
4. Test the API endpoints directly

Enjoy your new AI-powered Telegram bot! 🤖✨
