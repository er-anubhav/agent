"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, useEffect } from "react";
import { LoaderIcon } from "@/components/icons";

// Custom icons
const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const NotionIcon = ({ size = 16 }: { size?: number }) => (
  <div className="w-4 h-4 bg-black rounded-sm flex items-center justify-center">
    <span className="text-white text-xs">N</span>
  </div>
);

const ExternalLinkIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 3h6v6" />
    <path d="M10 14 21 3" />
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
  </svg>
);

interface NotionPage {
  id: string;
  title: string;
  type: 'page' | 'database';
  url: string;
  lastModified: string;
  selected: boolean;
}

export default function NotionSetupPage() {
  const [step, setStep] = useState(1);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceId, setWorkspaceId] = useState("");
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [isLoadingPages, setIsLoadingPages] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSettings, setSyncSettings] = useState({
    autoSync: true,
    syncFrequency: 'hourly' as 'hourly' | 'daily' | 'weekly',
    includeSubpages: true,
    includeDatabases: true
  });

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && !isConnected) {
      handleOAuthCallback(code, state);
    }
  }, [isConnected]);

  const handleOAuthCallback = async (code: string, state: string | null) => {
    setIsConnecting(true);
    try {
      const response = await fetch('/knowledge/api/connectors/notion/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, state }),
      });

      if (response.ok) {
        const data = await response.json();
        setAccessToken(data.accessToken);
        setWorkspaceName(data.workspaceName);
        setWorkspaceId(data.workspaceId);
        setIsConnected(true);
        setStep(2);
        
        // Load pages immediately after connection
        await loadNotionPages(data.accessToken);
      } else {
        const error = await response.json();
        alert(`Connection failed: ${error.error}`);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      alert('Connection failed. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleConnect = async () => {
    try {
      const response = await fetch('/knowledge/api/connectors/notion/auth');
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.authUrl;
      } else {
        alert('Failed to generate authorization URL');
      }
    } catch (error) {
      console.error('Connection error:', error);
      alert('Connection failed. Please try again.');
    }
  };

  const loadNotionPages = async (token: string = accessToken) => {
    setIsLoadingPages(true);
    try {
      const response = await fetch('/knowledge/api/connectors/notion/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken: token }),
      });

      if (response.ok) {
        const data = await response.json();
        const formattedPages = data.pages.map((page: any) => ({
          id: page.id,
          title: page.title,
          type: page.type === 'database' ? 'database' : 'page',
          url: page.url,
          lastModified: page.lastModified,
          selected: false,
        }));
        setPages(formattedPages);
      } else {
        const error = await response.json();
        alert(`Failed to load pages: ${error.error}`);
      }
    } catch (error) {
      console.error('Load pages error:', error);
      alert('Failed to load pages. Please try again.');
    } finally {
      setIsLoadingPages(false);
    }
  };

  const togglePageSelection = (pageId: string) => {
    setPages(prev => prev.map(page => 
      page.id === pageId ? { ...page, selected: !page.selected } : page
    ));
  };

  const selectAllPages = () => {
    const allSelected = pages.every(page => page.selected);
    setPages(prev => prev.map(page => ({ ...page, selected: !allSelected })));
  };

  const handleFinish = async () => {
    const selectedPages = pages.filter(p => p.selected);
    if (selectedPages.length === 0) {
      alert('Please select at least one page to sync.');
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch('/knowledge/api/connectors/notion/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          pageIds: selectedPages.map(p => p.id),
          syncSettings,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Successfully synced ${data.stats.successful} pages!`);
        // Redirect to connectors page
        window.location.href = '/knowledge/connectors';
      } else {
        const error = await response.json();
        alert(`Sync failed: ${error.error}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      alert('Sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <NotionIcon size={24} />
            <h1 className="text-3xl">Connect Notion</h1>
          </div>
          <p className="text-muted-foreground">
            Import your Notion pages and databases into your knowledge base
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/knowledge/connectors">
            Back to Connectors
          </Link>
        </Button>
      </div>

      {/* Step 1: Connect to Notion */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Connect to Your Notion Workspace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <h3 className="font-medium mb-2">What you'll be able to do:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckIcon size={16} />
                    Import pages and databases from your Notion workspace
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon size={16} />
                    Keep your knowledge base synced with Notion updates
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckIcon size={16} />
                    Search across your Notion content using AI
                  </li>
                </ul>
              </div>

              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Setup Requirements:</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• You need admin access to your Notion workspace</li>
                  <li>• The integration will only access pages you specifically grant permission to</li>
                  <li>• You can revoke access at any time from your Notion settings</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-center">
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                size="lg"
                className="px-8"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin mr-2">
                      <LoaderIcon size={16} />
                    </div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <NotionIcon size={16} />
                    <span className="ml-2">Connect with Notion</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Select Content */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Select Content to Import</CardTitle>
                <p className="text-muted-foreground mt-1">
                  Choose which pages and databases to sync from "{workspaceName}"
                </p>
              </div>
              <Button variant="outline" onClick={selectAllPages} disabled={isLoadingPages}>
                {pages.every(p => p.selected) ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingPages ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin mr-3">
                  <LoaderIcon size={24} />
                </div>
                <span>Loading pages from Notion...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {pages.length > 0 ? (
                  pages.map((page) => (
                    <div key={page.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={page.selected}
                          onChange={() => togglePageSelection(page.id)}
                          className="w-4 h-4"
                        />
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {page.type}
                          </Badge>
                          <span className="font-medium">{page.title}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>
                          Last modified: {new Date(page.lastModified).toLocaleDateString()}
                        </span>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={page.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLinkIcon size={14} />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No pages found in your Notion workspace.</p>
                    <p className="text-sm mt-2">Make sure the integration has access to your pages.</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button 
                onClick={() => setStep(3)} 
                disabled={pages.filter(p => p.selected).length === 0}
              >
                Continue ({pages.filter(p => p.selected).length} selected)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Configure Sync */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Configure Sync Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-sync</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically sync changes from Notion
                  </p>
                </div>
                <Switch
                  checked={syncSettings.autoSync}
                  onCheckedChange={(checked) => 
                    setSyncSettings(prev => ({ ...prev, autoSync: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Sync Frequency</Label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={syncSettings.syncFrequency}
                  onChange={(e) => setSyncSettings(prev => ({ 
                    ...prev, 
                    syncFrequency: e.target.value as 'hourly' | 'daily' | 'weekly'
                  }))}
                >
                  <option value="hourly">Every hour</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Include sub-pages</Label>
                  <p className="text-sm text-muted-foreground">
                    Sync child pages and nested content
                  </p>
                </div>
                <Switch
                  checked={syncSettings.includeSubpages}
                  onCheckedChange={(checked) => 
                    setSyncSettings(prev => ({ ...prev, includeSubpages: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Include databases</Label>
                  <p className="text-sm text-muted-foreground">
                    Sync database rows as individual documents
                  </p>
                </div>
                <Switch
                  checked={syncSettings.includeDatabases}
                  onCheckedChange={(checked) => 
                    setSyncSettings(prev => ({ ...prev, includeDatabases: checked }))
                  }
                />
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
              <h3 className="font-medium mb-2">Summary</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><span className="font-medium">Pages selected:</span> {pages.filter(p => p.selected).length}</p>
                <p><span className="font-medium">Auto-sync:</span> {syncSettings.autoSync ? 'Enabled' : 'Disabled'}</p>
                <p><span className="font-medium">Frequency:</span> {syncSettings.syncFrequency}</p>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} disabled={isSyncing}>
                Back
              </Button>
              <Button onClick={handleFinish} disabled={isSyncing}>
                {isSyncing ? (
                  <>
                    <div className="animate-spin mr-2">
                      <LoaderIcon size={16} />
                    </div>
                    Syncing Pages...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
