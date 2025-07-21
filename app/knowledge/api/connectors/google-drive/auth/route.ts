import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { z } from 'zod';

const googleDriveAuthSchema = z.object({
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
    const { code, state } = googleDriveAuthSchema.parse(body);

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      }),
    });

    console.log('Google OAuth token request status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Google OAuth token error:', errorText);
      throw new Error(`Failed to exchange code for token: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    let userInfo = {};
    if (userResponse.ok) {
      userInfo = await userResponse.json();
    }
    
    // Store the tokens securely in your database
    // For now, we'll return them to be stored on the client
    // In production, you should encrypt and store these securely
    
    return NextResponse.json({
      success: true,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      userInfo,
    });

  } catch (error) {
    console.error('Google Drive auth error:', error);
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

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const state = crypto.randomUUID(); // Generate random state for security

    if (!clientId || !redirectUri) {
      return NextResponse.json(
        { error: 'Google Drive client configuration missing' },
        { status: 500 }
      );
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.profile');
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    authUrl.searchParams.append('state', state);

    return NextResponse.json({
      authUrl: authUrl.toString(),
      state,
    });

  } catch (error) {
    console.error('Google Drive OAuth URL generation error:', error);
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  }
}
