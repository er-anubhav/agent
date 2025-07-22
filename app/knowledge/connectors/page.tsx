'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { LoaderIcon } from "@/components/icons";

// Real connectors with API implementation
const connectors = [
  {
    id: 'notion',
    name: 'Notion',
    description: 'Connect your Notion workspace to sync pages and databases',
    icon: '📝',
    color: 'bg-black text-white',
    status: 'available',
    isEnabled: false,
    lastSync: null,
    documentsCount: 0,
    syncFrequency: 'Configurable',
    workspace: null,
    setupUrl: '/knowledge/connectors/notion/setup',
    isImplemented: true
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Import documents from your Google Drive folders',
    icon: '📁',
    color: 'bg-blue-500 text-white',
    status: 'available',
    isEnabled: false,
    lastSync: null,
    documentsCount: 0,
    syncFrequency: 'Configurable',
    workspace: null,
    setupUrl: '/knowledge/connectors/google-drive/setup',
    isImplemented: true
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Sync documentation from your GitHub repositories',
    icon: '⚡',
    color: 'bg-gray-900 text-white',
    status: 'coming-soon',
    isEnabled: false,
    lastSync: null,
    documentsCount: 0,
    syncFrequency: 'Configurable',
    workspace: null,
    setupUrl: '/knowledge/connectors/github/setup',
    isImplemented: false
  },
  {
    id: 'web-crawler',
    name: 'Web Crawler',
    description: 'Crawl and index websites for documentation',
    icon: '🕷️',
    color: 'bg-purple-500 text-white',
    status: 'coming-soon',
    isEnabled: false,
    lastSync: null,
    documentsCount: 0,
    syncFrequency: 'Manual',
    workspace: null,
    setupUrl: '/knowledge/connectors/web-crawler/setup',
    isImplemented: false
  },
  {
    id: 'confluence',
    name: 'Confluence',
    description: 'Import pages and spaces from Atlassian Confluence',
    icon: '🌊',
    color: 'bg-blue-600 text-white',
    status: 'coming-soon',
    isEnabled: false,
    lastSync: null,
    documentsCount: 0,
    syncFrequency: 'Daily',
    workspace: null,
    isImplemented: false
  }
];

const availableConnectors = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Sync messages and files from Slack channels',
    icon: '💬',
    color: 'bg-purple-500 text-white',
    comingSoon: true,
    isImplemented: false
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Import files and folders from Dropbox',
    icon: '📦',
    color: 'bg-blue-400 text-white',
    comingSoon: true,
    isImplemented: false
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Sync issues and project documentation',
    icon: '🎫',
    color: 'bg-blue-700 text-white',
    comingSoon: true,
    isImplemented: false
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Import issues and project documents',
    icon: '📐',
    color: 'bg-gray-700 text-white',
    comingSoon: true,
    isImplemented: false
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Import messages and files from Discord servers',
    icon: '🎮',
    color: 'bg-indigo-500 text-white',
    comingSoon: true,
    isImplemented: false
  },
  {
    id: 'airtable',
    name: 'Airtable',
    description: 'Import records and data from Airtable bases',
    icon: '📊',
    color: 'bg-yellow-500 text-white',
    comingSoon: true,
    isImplemented: false
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Import designs and documentation from Figma',
    icon: '🎨',
    color: 'bg-pink-500 text-white',
    comingSoon: true,
    isImplemented: false
  }
];

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'connected':
      return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
    case 'syncing':
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <div className="animate-spin mr-1">
            <LoaderIcon size={12} />
          </div>
          Syncing
        </Badge>
      );
    case 'coming-soon':
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Coming Soon</Badge>;
    case 'error':
      return <Badge className="bg-red-100 text-red-800">Error</Badge>;
    default:
      return <Badge variant="secondary">Disconnected</Badge>;
  }
}

export default function ConnectorsPage() {
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false);
  const [isNotionConnected, setIsNotionConnected] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [connectorStats, setConnectorStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Fetch real connector status from API
  useEffect(() => {
    const fetchConnectorStatus = async () => {
      try {
        const response = await fetch('/knowledge/api/connectors/status');
        if (response.ok) {
          const data = await response.json();
          setConnectorStats(data.connectors);
        }
      } catch (error) {
        console.error('Failed to fetch connector status:', error);
      } finally {
        setLoading(false);
      }
    };

    setIsClient(true);
    // Check localStorage for tokens
    const googleToken = window.localStorage.getItem('googleDriveAccessToken');
    const notionToken = window.localStorage.getItem('notionAccessToken');
    setIsGoogleDriveConnected(!!googleToken);
    setIsNotionConnected(!!notionToken);
    fetchConnectorStatus();
  }, []);

  // Clone connectors array and update with real data
  const updatedConnectors = connectors.map(connector => {
    const stats = connectorStats[connector.id] || {};
    
    if (connector.id === 'google-drive' && isClient && isGoogleDriveConnected) {
      return {
        ...connector,
        status: 'connected',
        isEnabled: true,
        documentsCount: stats.documentsCount || 0,
        lastSync: stats.lastSync || new Date().toISOString(),
      };
    }
    
    if (connector.id === 'notion' && isClient && isNotionConnected) {
      return {
        ...connector,
        status: 'connected',
        isEnabled: true,
        documentsCount: stats.documentsCount || 0,
        lastSync: stats.lastSync || new Date().toISOString(),
      };
    }
    
    if (stats.isConnected || stats.documentsCount > 0) {
      return {
        ...connector,
        status: 'connected',
        isEnabled: true,
        documentsCount: stats.documentsCount || 0,
        lastSync: stats.lastSync || new Date().toISOString(),
      };
    }
    
    return connector;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex  mt-6 items-center justify-between">
        <div>
          <h1 className="text-2xl">Connectors</h1>
          <p className="text-muted-foreground">
            Connect external services to automatically sync your knowledge base
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl">
              {updatedConnectors.filter(c => c.status === 'connected').length}
            </div>
            <p className="text-sm text-muted-foreground">Connected Sources</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl">
              {updatedConnectors.reduce((sum, c) => sum + c.documentsCount, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Synced Documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl">
              {updatedConnectors.filter(c => c.isEnabled).length}
            </div>
            <p className="text-sm text-muted-foreground">Active Syncs</p>
          </CardContent>
        </Card>
      </div>

      {/* Connected Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {updatedConnectors.filter(c => c.status === 'connected').length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No connected sources yet</p>
              <p className="text-sm">Connect a source below to get started</p>
            </div>
          ) : (
            updatedConnectors
              .filter(c => c.status === 'connected')
              .map((connector) => (
                <div key={connector.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg ${connector.color} flex items-center justify-center text-lg`}>
                      {connector.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{connector.name}</h3>
                        {getStatusBadge(connector.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{connector.workspace}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>{connector.documentsCount} documents</span>
                        <span>Syncs {connector.syncFrequency.toLowerCase()}</span>
                        {connector.lastSync && (
                          <span>Last sync: {formatDate(connector.lastSync)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Auto-sync</span>
                      <Switch checked={connector.isEnabled} />
                    </div>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                    <Button variant="outline" size="sm">
                      Sync Now
                    </Button>
                  </div>
                </div>
              ))
          )}
        </CardContent>
      </Card>

      {/* Available Connectors */}
      <Card>
        <CardHeader>
          <CardTitle>Available Connectors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ...connectors.filter(c => c.status !== 'connected'),
              ...availableConnectors
            ].map((connector) => {
              const isComingSoon = ('comingSoon' in connector && connector.comingSoon) || 
                                 ('status' in connector && connector.status === 'coming-soon');
              const isImplemented = 'isImplemented' in connector ? connector.isImplemented : true;
              const isAvailable = !isComingSoon && isImplemented;
              
              return (
                <div key={connector.id} className="p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${connector.color} flex items-center justify-center text-lg`}>
                        {connector.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{connector.name}</h3>
                          {isComingSoon && (
                            <Badge variant="secondary" className="text-xs">
                              Coming Soon
                            </Badge>
                          )}
                          {!isComingSoon && !isImplemented && (
                            <Badge variant="outline" className="text-xs">
                              Setup Required
                            </Badge>
                          )}
                          {isAvailable && 'status' in connector && connector.status === 'available' && (
                            <Badge className="text-xs bg-green-100 text-green-800">
                              Ready to Connect
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {connector.description}
                        </p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      disabled={!isAvailable}
                      onClick={() => {
                        if (isAvailable) {
                          window.location.href = `/knowledge/connectors/${connector.id}/setup`;
                        }
                      }}
                    >
                      {isComingSoon ? (
                        'Coming Soon'
                      ) : isAvailable ? (
                        'Connect'
                      ) : (
                        'Setup Required'
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <h4 className="font-medium">Setting up connectors</h4>
              <p className="text-sm text-muted-foreground">
                Learn how to connect and configure your data sources
              </p>
            </div>
            <Button variant="outline" size="sm">
              View Guide
            </Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <h4 className="font-medium">Managing sync schedules</h4>
              <p className="text-sm text-muted-foreground">
                Configure when and how often your data syncs
              </p>
            </div>
            <Button variant="outline" size="sm">
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
