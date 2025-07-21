import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { z } from 'zod';
import { GoogleDriveTokenManager } from '@/lib/google-drive/tokenManager';

const googleDriveFilesSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string().optional().nullable(),
  folderId: z.string().optional(),
  pageToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accessToken, refreshToken, folderId, pageToken } = googleDriveFilesSchema.parse(body);

    console.log('🔍 Validating Google Drive access token...');
    
    // Validate and refresh token if needed
    let finalAccessToken: string;
    let tokenRefreshed = false;
    let newTokenData: any = null;

    try {
      const tokenResult = await GoogleDriveTokenManager.getValidAccessToken(accessToken, refreshToken || undefined);
      finalAccessToken = tokenResult.accessToken;
      tokenRefreshed = tokenResult.needsRefresh;
      newTokenData = tokenResult.newTokenData;

      if (tokenRefreshed) {
        console.log('✅ Token was refreshed successfully');
      }
    } catch (error) {
      console.error('❌ Token validation/refresh failed:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'Authentication failed',
          requiresReauth: true 
        },
        { status: 401 }
      );
    }

    // Build query for supported file types
    const supportedMimeTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.google-apps.document',
      'application/vnd.google-apps.presentation',
      'application/vnd.google-apps.spreadsheet',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    const mimeQuery = supportedMimeTypes.map(type => `mimeType='${type}'`).join(' or ');
    
    let query = `(${mimeQuery}) and trashed=false`;
    if (folderId) {
      query += ` and '${folderId}' in parents`;
    }

    const searchParams = new URLSearchParams({
      q: query,
      fields: 'nextPageToken,files(id,name,mimeType,size,modifiedTime,webViewLink,parents,iconLink)',
      pageSize: '50',
      orderBy: 'modifiedTime desc',
    });

    if (pageToken) {
      searchParams.append('pageToken', pageToken);
    }

    const apiUrl = `https://www.googleapis.com/drive/v3/files?${searchParams}`;
    console.log('📡 Making Google Drive API request to:', apiUrl);
    console.log('🔑 Using access token (first 20 chars):', finalAccessToken.substring(0, 20) + '...');

    const filesResponse = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${finalAccessToken}`,
      },
    });

    console.log('Google Drive API Response Status:', filesResponse.status);
    console.log('Google Drive API Response Headers:', Object.fromEntries(filesResponse.headers.entries()));

    if (!filesResponse.ok) {
      const errorText = await filesResponse.text();
      console.error('Google Drive API Error Response:', errorText);
      
      let errorMessage = 'Failed to fetch files from Google Drive';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = `Google Drive API Error: ${errorJson.error.message}`;
        }
      } catch (e) {
        // If response is not JSON, use the text as error message
        if (errorText) {
          errorMessage = `Google Drive API Error: ${errorText}`;
        }
      }
      
      throw new Error(errorMessage);
    }

    const filesData = await filesResponse.json();

    // Format the results
    const formatGoogleDriveFile = (file: any) => {
      return {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size ? parseInt(file.size) : undefined,
        modifiedTime: file.modifiedTime,
        webViewLink: file.webViewLink,
        iconLink: file.iconLink,
        parents: file.parents || [],
        type: getFileType(file.mimeType),
      };
    };

    const files = filesData.files.map(formatGoogleDriveFile);

    const response: any = {
      success: true,
      files,
      nextPageToken: filesData.nextPageToken,
    };

    // Include new token data if token was refreshed
    if (tokenRefreshed && newTokenData) {
      response.tokenRefreshed = true;
      response.newTokenData = newTokenData;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Google Drive files fetch error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch files' 
      },
      { status: 500 }
    );
  }
}

function getFileType(mimeType: string): string {
  switch (mimeType) {
    case 'application/pdf':
      return 'PDF';
    case 'text/plain':
      return 'Text';
    case 'application/vnd.google-apps.document':
      return 'Google Doc';
    case 'application/vnd.google-apps.presentation':
      return 'Google Slides';
    case 'application/vnd.google-apps.spreadsheet':
      return 'Google Sheets';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return 'Word Doc';
    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      return 'PowerPoint';
    default:
      return 'Document';
  }
}
