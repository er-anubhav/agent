'use client';

import { KnowledgeSearch } from '@/components/knowledge/KnowledgeSearch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadIcon, LoaderIcon, FileIcon } from '@/components/icons';
import Link from 'next/link';
import { useState, useEffect } from 'react';

interface KnowledgeStats {
  totalDocuments: number;
  totalChunks: number;
  vectorStoreSize: string;
  indexingStatus: 'idle' | 'processing' | 'error';
  lastIndexed: string;
  recentUploads: Array<{
    id: string;
    title: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    uploadedAt: string;
  }>;
}

const useKnowledgeBaseStats = () => {
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/knowledge/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch knowledge stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return { stats, loading };
};

export default function KnowledgePage() {
  const { stats, loading } = useKnowledgeBaseStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin">
          <LoaderIcon size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl">Knowledge Base</h1>
            <p className="text-muted-foreground">
              Manage your documents and data sources for AI-powered search
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/knowledge/documents/upload">
                <UploadIcon size={16} />
                <span className="ml-2">Add Documents</span>
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/knowledge/connectors">
                Add Connector
              </Link>
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle>Search Knowledge Base</CardTitle>
            <CardDescription>
              Search across all your documents using AI-powered semantic search
            </CardDescription>
          </CardHeader>
          <CardContent>
            <KnowledgeSearch />
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <div className="text-muted-foreground">
                <FileIcon size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{stats?.totalDocuments || 0}</div>
              <p className="text-xs text-muted-foreground">
                Indexed and searchable
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vector Store Size</CardTitle>
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{stats?.vectorStoreSize || '0 MB'}</div>
              <p className="text-xs text-muted-foreground">
                Embeddings storage
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Indexed</CardTitle>
              {stats?.indexingStatus === 'processing' ? (
                <div className="text-muted-foreground animate-spin">
                  <LoaderIcon size={16} />
                </div>
              ) : (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{stats?.lastIndexed || 'Never'}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.indexingStatus === 'processing' ? 'Currently indexing...' : 'System up to date'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
              <div className="text-green-600">✓</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl">{stats?.totalChunks || 0}</div>
              <p className="text-xs text-muted-foreground">
                Searchable segments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Documents</CardTitle>
              <CardDescription>
                Recently added or updated documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats?.recentUploads?.map((doc, index) => (
                <div key={doc.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-muted-foreground">
                      <FileIcon size={16} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">Added {doc.uploadedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === 'processing' ? (
                      <>
                        <div className="animate-spin text-blue-500">
                          <LoaderIcon size={14} />
                        </div>
                        <span className="text-xs text-blue-500">Processing</span>
                      </>
                    ) : doc.status === 'completed' ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600">Indexed</span>
                      </>
                    ) : doc.status === 'failed' ? (
                      <>
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-xs text-red-600">Failed</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-xs text-yellow-600">Pending</span>
                      </>
                    )}
                  </div>
                </div>
              )) || (
                <p className="text-center text-muted-foreground py-4">
                  No recent documents
                </p>
              )}
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/knowledge/documents">
                  View All Documents
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks and shortcuts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/knowledge/documents/upload">
                  <UploadIcon size={16} />
                  <span className="ml-2">Upload New Documents</span>
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/knowledge/connectors">
                  <div className="w-4 h-4 mr-2 bg-purple-500 rounded"></div>
                  Connect Notion Workspace
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/knowledge/connectors">
                  <div className="w-4 h-4 mr-2 bg-blue-500 rounded"></div>
                  Connect Google Drive
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Knowledge base system health and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm">Vector Store</p>
                  <p className="text-xs text-muted-foreground">Healthy</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm">Embedding Service</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-sm">Search API</p>
                  <p className="text-xs text-muted-foreground">Responsive</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
