import { z } from 'zod';

const TokenDataSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number(),
  token_type: z.string().default('Bearer'),
  scope: z.string().optional(),
});

export type TokenData = z.infer<typeof TokenDataSchema>;

export class GoogleDriveTokenManager {
  private static async refreshAccessToken(refreshToken: string): Promise<TokenData> {
    console.log('🔄 Refreshing Google OAuth token...');
    
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error('❌ Token refresh failed:', errorText);
      throw new Error(`Failed to refresh token: ${errorText}`);
    }

    const tokenData = await refreshResponse.json();
    console.log('✅ Token refreshed successfully');
    
    return TokenDataSchema.parse(tokenData);
  }

  public static async getValidAccessToken(
    currentToken: string,
    refreshToken?: string
  ): Promise<{ accessToken: string; needsRefresh: boolean; newTokenData?: TokenData }> {
    
    // First, try the current token
    const testResponse = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${currentToken}`,
      },
    });

    if (testResponse.ok) {
      console.log('✅ Current access token is valid');
      return { accessToken: currentToken, needsRefresh: false };
    }

    console.log('⚠️ Current access token is invalid, attempting refresh...');

    // If current token is invalid and we have a refresh token, try to refresh
    if (refreshToken) {
      try {
        const newTokenData = await this.refreshAccessToken(refreshToken);
        return {
          accessToken: newTokenData.access_token,
          needsRefresh: true,
          newTokenData,
        };
      } catch (error) {
        console.error('❌ Token refresh failed:', error);
        throw new Error('Token expired and refresh failed. Please re-authenticate.');
      }
    }

    throw new Error('Token expired and no refresh token available. Please re-authenticate.');
  }

  public static async validateGoogleDriveAccess(accessToken: string): Promise<boolean> {
    try {
      // Test with a simple Drive API call
      const testResponse = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return testResponse.ok;
    } catch (error) {
      console.error('❌ Drive access validation failed:', error);
      return false;
    }
  }
}
