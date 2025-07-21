'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, ArrowLeft, CheckCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function GoogleDriveSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'auth' | 'select' | 'sync'>('auth');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Load tokens from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAccessToken = window.localStorage.getItem('googleDriveAccessToken');
      const storedRefreshToken = window.localStorage.getItem('googleDriveRefreshToken');
      
      if (storedAccessToken) {
        setAccessToken(storedAccessToken);
        setIsAuthenticated(true);
        setStep('select');
        
        if (storedRefreshToken) {
          setRefreshToken(storedRefreshToken);
        }
        
        // Try to load files with stored tokens
        loadFiles(storedAccessToken, storedRefreshToken || undefined);
      }
    }
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code && !isAuthenticated) {
        handleAuthCallback(code);
      }
    }
  }, [isAuthenticated]);

  const handleAuth = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/knowledge/api/connectors/google-drive/auth', {
        method: 'GET',
      });
      
      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      } else {
        throw new Error('Failed to get auth URL');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      alert('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthCallback = async (code: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/knowledge/api/connectors/google-drive/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        const data = await response.json();
        setUserInfo(data.userInfo);
        setAccessToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        
        // Persist tokens in localStorage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('googleDriveAccessToken', data.accessToken);
          if (data.refreshToken) {
            window.localStorage.setItem('googleDriveRefreshToken', data.refreshToken);
          }
        }
        
        setIsAuthenticated(true);
        setStep('select');
        await loadFiles(data.accessToken, data.refreshToken);
      } else {
        throw new Error('Failed to authenticate');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      alert('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFiles = async (token?: string, refreshTkn?: string) => {
    try {
      setIsLoading(true);
      const response = await fetch('/knowledge/api/connectors/google-drive/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          accessToken: token || accessToken,
          refreshToken: refreshTkn || refreshToken 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);

        // Handle token refresh
        if (data.tokenRefreshed && data.newTokenData) {
          console.log('🔄 Token was refreshed, updating stored tokens');
          setAccessToken(data.newTokenData.access_token);
          
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('googleDriveAccessToken', data.newTokenData.access_token);
            if (data.newTokenData.refresh_token) {
              window.localStorage.setItem('googleDriveRefreshToken', data.newTokenData.refresh_token);
              setRefreshToken(data.newTokenData.refresh_token);
            }
          }
        }
      } else {
        const errorData = await response.json();
        if (errorData.requiresReauth) {
          alert('Your Google Drive session has expired. Please re-authenticate.');
          setIsAuthenticated(false);
          setStep('auth');
          // Clear stored tokens
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('googleDriveAccessToken');
            window.localStorage.removeItem('googleDriveRefreshToken');
          }
        } else {
          throw new Error(errorData.error || 'Failed to load files');
        }
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      alert('Failed to load files: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file to sync.');
      return;
    }

    setIsLoading(true);
    setStep('sync');

    try {
      const response = await fetch('/knowledge/api/connectors/google-drive/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          fileIds: selectedFiles
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Successfully synced ${selectedFiles.length} documents from Google Drive!`);
        router.push('/knowledge/connectors');
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed. Please try again.');
      setStep('select');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OAuth callback (move to useEffect to avoid infinite re-renders)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Restore accessToken from localStorage if available
      const storedToken = window.localStorage.getItem('googleDriveAccessToken');
      if (storedToken && !accessToken) {
        setAccessToken(storedToken);
        setIsAuthenticated(true);
        setStep('select');
        loadFiles(storedToken);
        return;
      }
      // Handle OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      if (code && !isAuthenticated && step === 'auth') {
        handleAuthCallback(code);
      }
    }
  }, [isAuthenticated, step, accessToken]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/knowledge/connectors">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Connectors
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl">Connect Google Drive</h1>
          <p className="text-muted-foreground">
            Import documents, presentations, and files from your Google Drive
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-8 mb-8">
        {['Authentication', 'Select Files', 'Sync'].map((stepName, index) => {
          const stepKey = ['auth', 'select', 'sync'][index];
          const isActive = step === stepKey;
          const isCompleted = ['auth', 'select'].indexOf(step) > ['auth', 'select'].indexOf(stepKey);
          
          return (
            <div key={stepName} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                ${isCompleted ? 'bg-green-500 text-white' : 
                  isActive ? 'bg-blue-500 text-white' : 
                  'bg-gray-200 text-gray-600'}
              `}>
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : index + 1}
              </div>
              <span className={`ml-2 text-sm ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                {stepName}
              </span>
              {index < 2 && <div className="w-8 h-0.5 bg-gray-200 mx-4" />}
            </div>
          );
        })}
      </div>

      {/* Authentication Step */}
      {step === 'auth' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
                📄
              </div>
              Authenticate with Google Drive
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">What we'll access:</p>
                  <ul className="text-sm text-blue-800 mt-2 space-y-1">
                    <li>• Read access to your Google Drive files and folders</li>
                    <li>• View your Google account information (name, email)</li>
                    <li>• Download content from Google Docs, Sheets, and Slides</li>
                  </ul>
                </div>
              </div>
            </div>

            {!isAuthenticated ? (
              <Button
                onClick={handleAuth}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Connecting...' : 'Connect to Google Drive'}
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <div>
                  <p className="font-medium">Connected successfully!</p>
                  <p className="text-sm text-muted-foreground">
                    Authenticated as {userInfo?.email}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* File Selection Step */}
      {step === 'select' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Files to Sync</CardTitle>
            <p className="text-sm text-muted-foreground">
              Choose which files and folders you want to import into your knowledge base
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {files.map((file) => (
                <div key={file.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={selectedFiles.includes(file.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFiles([...selectedFiles, file.id]);
                      } else {
                        setSelectedFiles(selectedFiles.filter(id => id !== file.id));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{file.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {file.mimeType.includes('document') ? 'Document' :
                         file.mimeType.includes('presentation') ? 'Presentation' :
                         file.mimeType.includes('spreadsheet') ? 'Spreadsheet' :
                         'File'}
                      </Badge>
                    </div>
                    {file.modifiedTime && (
                      <p className="text-sm text-muted-foreground">
                        Modified: {new Date(file.modifiedTime).toISOString().split('T')[0]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep('auth')}
              >
                Back
              </Button>
              <Button
                onClick={handleSync}
                disabled={selectedFiles.length === 0}
              >
                Sync Selected Files ({selectedFiles.length})
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Step */}
      {step === 'sync' && (
        <Card>
          <CardHeader>
            <CardTitle>Syncing Your Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
              <div>
                <p className="font-medium">Importing your Google Drive files...</p>
                <p className="text-sm text-muted-foreground">
                  Syncing {selectedFiles.length} files to your knowledge base
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
