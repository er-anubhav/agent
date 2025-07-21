import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { z } from 'zod';

const notionAuthSchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { code, state } = notionAuthSchema.parse(body);

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://api.notion.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.NOTION_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    
    // Store the access token and workspace info in your database
    // For now, we'll return it to be stored on the client
    // In production, you should encrypt and store this securely
    
    return NextResponse.json({
      success: true,
      accessToken: tokenData.access_token,
      workspaceId: tokenData.workspace_id,
      workspaceName: tokenData.workspace_name,
      workspaceIcon: tokenData.workspace_icon,
      botId: tokenData.bot_id,
    });

  } catch (error) {
    console.error('Notion auth error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      },
      { status: 500 }
    );
  }
}

// Generate OAuth URL
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clientId = process.env.NOTION_CLIENT_ID;
    const redirectUri = process.env.NOTION_REDIRECT_URI;
    const state = crypto.randomUUID(); // Generate random state for security

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: 'Notion client configuration missing' },
        { status: 500 }
      );
    }

    const authUrl = new URL('https://api.notion.com/v1/oauth/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('owner', 'user');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', state);

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state,
    });

  } catch (error) {
    console.error('Notion OAuth URL generation error:', error);
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
}
