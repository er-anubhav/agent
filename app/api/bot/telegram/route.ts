import { compare } from 'bcrypt-ts';
import { NextRequest } from 'next/server';
import { getUser, getMessagesByChatId } from '@/lib/db/queries';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { user, chat, message } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { ChatSDKError } from '@/lib/errors';

// Initialize database connection
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

// In-memory session store (you can use Redis for production)
const userSessions = new Map<string, {
  userId: string;
  email: string;
  name: string;
  authenticatedAt: Date;
}>();

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export async function POST(request: NextRequest) {
  try {
    // Log incoming request for debugging
    const body = await request.text();
    console.log('🔍 Raw request body:', JSON.stringify(body));
    console.log('🔍 Request headers:', Object.fromEntries(request.headers.entries()));
    
    let data;
    try {
      data = JSON.parse(body || '{}');
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.log('🔍 Body that failed to parse:', body);
      return Response.json({
        reply: 'Invalid JSON format.'
      });
    }

    console.log('🔍 Parsed data:', JSON.stringify(data, null, 2));

    // Handle different data formats from n8n
    let telegramUserId, telegramChatId, userMessage;
    
    if (data.message && typeof data.message === 'object') {
      // Standard Telegram webhook format
      telegramUserId = data.message.from?.id?.toString();
      telegramChatId = data.message.chat?.id?.toString();
      userMessage = data.message.text;
      console.log('🔍 Using Telegram webhook format');
    } else if (data.telegramUserId && data.telegramChatId && data.message) {
      // Custom format from n8n
      telegramUserId = data.telegramUserId.toString();
      telegramChatId = data.telegramChatId.toString();
      userMessage = data.message;
      console.log('🔍 Using n8n custom format');
    } else {
      console.error('❌ Unrecognized data format:', data);
      console.log('🔍 Available keys:', Object.keys(data));
      return Response.json({
        reply: 'Invalid request format. Expected Telegram message data.'
      });
    }

    console.log('🔍 Extracted values:', { telegramUserId, telegramChatId, userMessage });

    if (!telegramUserId || !telegramChatId || !userMessage) {
      console.error('❌ Missing required fields:', { 
        telegramUserId: !!telegramUserId, 
        telegramChatId: !!telegramChatId, 
        userMessage: !!userMessage 
      });
      return Response.json({
        reply: 'Missing required fields: telegramUserId, telegramChatId, or message.'
      });
    }

    // Check if user is already authenticated
    const session = userSessions.get(telegramUserId);
    const isSessionValid = session && 
      (Date.now() - session.authenticatedAt.getTime()) < SESSION_TIMEOUT;

    if (!isSessionValid) {
      // User needs to authenticate
      return await handleAuthentication(telegramUserId, userMessage);
    }

    // User is authenticated, process their question
    return await handleAuthenticatedQuery(session, userMessage);

  } catch (error) {
    console.error('Bot error:', error);
    
    // More specific error messages
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return Response.json({
        reply: 'Sorry, I received malformed data. Please try sending your message again.'
      });
    }
    
    return Response.json({
      reply: 'Sorry, I encountered an error. Please try again or contact support.'
    });
  }
}

async function handleAuthentication(telegramUserId: string, message: string) {
  // Handle special commands
  if (message === '/start') {
    return Response.json({
      reply: `🤖 Welcome to your Personal AI Assistant!\n\n🔐 To get started, please authenticate with your credentials:\n\nemail: your@email.com password: yourpassword\n\n📝 Example:\nemail: testbot@example.com password: testbot123\n\n❓ Need help? Send /help`
    });
  }

  if (message === '/help') {
    return Response.json({
      reply: `🤖 Personal AI Assistant Help\n\n📋 Available Commands:\n• /start - Welcome message\n• /help - Show this help\n• /status - Check authentication status\n\n🔐 To authenticate:\nemail: your@email.com password: yourpassword\n\n💡 Once authenticated, just ask me anything!`
    });
  }

  // Check if message contains email and password
  const authPattern = /email:\s*(\S+)\s+password:\s*(\S+)/i;
  const match = message.match(authPattern);

  if (!match) {
    return Response.json({
      reply: `🔐 Please authenticate first!\n\nSend your credentials in this format:\nemail: your@email.com password: yourpassword\n\nExample:\nemail: testbot@example.com password: testbot123\n\n💡 Tip: Send /help for more information`
    });
  }

  const [, email, password] = match;

  try {
    // Find user by email using the existing getUser function
    const users = await getUser(email.toLowerCase());

    if (users.length === 0 || !users[0].password) {
      return Response.json({
        reply: '❌ Invalid email or password. Please try again.'
      });
    }

    const foundUser = users[0];

    // Verify password (we already checked it's not null above)
    const isValidPassword = await compare(password, foundUser.password!);
    
    if (!isValidPassword) {
      return Response.json({
        reply: '❌ Invalid email or password. Please try again.'
      });
    }

    // Create session
    userSessions.set(telegramUserId, {
      userId: foundUser.id,
      email: foundUser.email,
      name: foundUser.email, // Using email as name since schema doesn't have name field
      authenticatedAt: new Date(),
    });

    return Response.json({
      reply: `✅ Welcome ${foundUser.email}!\n\nYou're now authenticated. Ask me anything about your knowledge base or previous conversations!`
    });

  } catch (error) {
    console.error('Authentication error:', error);
    return Response.json({
      reply: '❌ Authentication failed. Please check your credentials and try again.'
    });
  }
}

async function handleAuthenticatedQuery(session: any, question: string) {
  try {
    const lowerQuestion = question.toLowerCase().trim();

    // Handle special commands
    if (lowerQuestion === '/help') {
      return Response.json({
        reply: `🤖 Available commands:
        
• Ask any question about your data
• /logout - Sign out
• /status - Check your session
• /history - Get recent chat summary
• /help - Show this help

Just type your question normally and I'll answer based on your knowledge base!`
      });
    }

    if (lowerQuestion === '/logout') {
      userSessions.delete(session.userId);
      return Response.json({
        reply: '👋 You have been logged out successfully.'
      });
    }

    if (lowerQuestion === '/status') {
      const timeLeft = SESSION_TIMEOUT - (Date.now() - session.authenticatedAt.getTime());
      const minutesLeft = Math.floor(timeLeft / 60000);
      
      return Response.json({
        reply: `✅ Authenticated as: ${session.name} (${session.email})
⏰ Session expires in: ${minutesLeft} minutes`
      });
    }

    if (lowerQuestion === '/history') {
      const context = await getUserContext(session.userId);
      return Response.json({
        reply: context || 'No recent conversation history found.'
      });
    }

    // Regular question processing
    const userContext = await getUserContext(session.userId);
    const answer = await processUserQuestion(session.userId, question, userContext);

    return Response.json({
      reply: answer
    });

  } catch (error) {
    console.error('Query processing error:', error);
    return Response.json({
      reply: 'Sorry, I encountered an error. Please try again or type /help for assistance.'
    });
  }
}

async function getUserContext(userId: string): Promise<string> {
  try {
    // Get recent chat history
    const recentMessages = await db
      .select({
        content: message.parts,
        role: message.role,
        createdAt: message.createdAt,
      })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(eq(chat.userId, userId))
      .orderBy(desc(message.createdAt))
      .limit(20);

    if (recentMessages.length === 0) {
      return '';
    }

    const context = recentMessages
      .reverse()
      .map((msg: any) => {
        // Extract text from parts array
        const parts = msg.content as any[];
        const textContent = parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => part.text)
          .join(' ');
        return `${msg.role}: ${textContent}`;
      })
      .join('\n');

    return `\nYour recent conversation history:\n${context}\n`;

  } catch (error) {
    console.error('Error getting user context:', error);
    return '';
  }
}

async function processUserQuestion(userId: string, question: string, context: string = ''): Promise<string> {
  try {
    const { streamText } = await import('ai');
    const { myProvider } = await import('@/lib/ai/providers');
    
    const systemPrompt = `You are a personal AI assistant with access to the user's chat history and knowledge base. 
    Provide helpful, personalized responses based on their previous conversations and data.
    Be conversational and reference their history when relevant.${context ? '\n\n' + context : ''}`;

    const result = await streamText({
      model: myProvider.languageModel('chat-model'),
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: question
        }
      ],
    });

    let fullResponse = '';
    for await (const delta of result.textStream) {
      fullResponse += delta;
    }

    return fullResponse;

  } catch (error) {
    console.error('Error processing question:', error);
    return 'I apologize, but I encountered an error while processing your question. Please try again.';
  }
}

// Cleanup expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [telegramUserId, session] of userSessions.entries()) {
    if ((now - session.authenticatedAt.getTime()) > SESSION_TIMEOUT) {
      userSessions.delete(telegramUserId);
    }
  }
}, 5 * 60 * 1000); // Check every 5 minutes
