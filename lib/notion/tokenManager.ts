// Notion Token Manager - similar to Google Drive token manager
// This manages Notion OAuth tokens with refresh capability

export class NotionTokenManager {
  private static readonly STORAGE_KEY = 'notionAccessToken';
  private static readonly REFRESH_KEY = 'notionRefreshToken';
  private static readonly EXPIRY_KEY = 'notionTokenExpiry';

  static setTokens(accessToken: string, refreshToken?: string, expiresIn?: number) {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.STORAGE_KEY, accessToken);
    
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_KEY, refreshToken);
    }
    
    if (expiresIn) {
      const expiryTime = Date.now() + (expiresIn * 1000);
      localStorage.setItem(this.EXPIRY_KEY, expiryTime.toString());
    }
  }

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.STORAGE_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_KEY);
  }

  static isTokenExpired(): boolean {
    if (typeof window === 'undefined') return true;
    
    const expiryTime = localStorage.getItem(this.EXPIRY_KEY);
    if (!expiryTime) return false; // If no expiry set, assume it's valid
    
    return Date.now() > parseInt(expiryTime);
  }

  static async getValidAccessToken(): Promise<string | null> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      return null;
    }

    // Notion tokens typically don't expire, but we can add refresh logic if needed
    if (this.isTokenExpired()) {
      return await this.refreshAccessToken();
    }

    return accessToken;
  }

  static async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      this.clearTokens();
      return null;
    }

    try {
      // Note: Notion doesn't typically use refresh tokens like Google Drive
      // Most Notion integrations use long-lived tokens
      // This is here for future compatibility if Notion adds refresh tokens
      
      console.warn('Notion token refresh not implemented - tokens are typically long-lived');
      return this.getAccessToken();
      
    } catch (error) {
      console.error('Failed to refresh Notion token:', error);
      this.clearTokens();
      return null;
    }
  }

  static clearTokens() {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
    localStorage.removeItem(this.EXPIRY_KEY);
  }

  static isConnected(): boolean {
    return !!this.getAccessToken();
  }
}
