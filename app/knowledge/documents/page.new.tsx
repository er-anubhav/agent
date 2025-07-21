'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { KnowledgeBaseLayout } from '@/components/knowledge/KnowledgeBaseLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileIcon, LoaderIcon, UploadIcon, TrashIcon } from '@/components/icons';

interface Document {
  id: string;
  title: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedAt: string;
  size?: number;
  chunks?: number;
  metadata?: {
    pages?: number;
    author?: string;
    language?: string;
  };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    fetchDocuments();
  }, [searchQuery, statusFilter, typeFilter]);

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await fetch(`/knowledge/api/documents?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/knowledge/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      } else {
        alert('Failed to delete document');
      }
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'processing': return <div className="animate-spin"><LoaderIcon size={12} /></div>;
      case 'failed': return <div className="w-2 h-2 bg-red-500 rounded-full" />;
      default: return <div className="w-2 h-2 bg-yellow-500 rounded-full" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <KnowledgeBaseLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin">
            <LoaderIcon size={32} />
          </div>
        </div>
      </KnowledgeBaseLayout>
    );
  }

  return (
    <KnowledgeBaseLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl">Documents</h1>
            <p className="text-muted-foreground">
              Manage your uploaded documents and their processing status
            </p>
          </div>
          <Button asChild>
            <Link href="/knowledge/documents/upload">
              <UploadIcon size={16} />
              <span className="ml-2">Upload Documents</span>
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter Documents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="search" className="text-sm font-medium mb-2 block">
                  Search
                </label>
                <Input
                  id="search"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="status" className="text-sm font-medium mb-2 block">
                  Status
                </label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="type" className="text-sm font-medium mb-2 block">
                  Type
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="txt">Text</SelectItem>
                    <SelectItem value="md">Markdown</SelectItem>
                    <SelectItem value="docx">Word</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="space-y-4">
          {documents.length > 0 ? (
            documents.map((document) => (
              <Card key={document.id} className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-muted-foreground">
                        <FileIcon size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium">{document.title}</h3>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(document.status)}
                            <span className={`text-sm ${getStatusColor(document.status)}`}>
                              {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span>Type: {document.type.toUpperCase()}</span>
                          <span>Size: {formatFileSize(document.size)}</span>
                          {document.chunks && <span>Chunks: {document.chunks}</span>}
                          <span>Uploaded: {new Date(document.uploadedAt).toLocaleDateString()}</span>
                        </div>
                        {document.metadata && (
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            {document.metadata.pages && <span>Pages: {document.metadata.pages}</span>}
                            {document.metadata.author && <span>Author: {document.metadata.author}</span>}
                            {document.metadata.language && <span>Language: {document.metadata.language}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/knowledge/documents/${document.id}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(document.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <TrashIcon size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground mb-4">
                  <FileIcon size={48} />
                </div>
                <h3 className="text-lg font-medium mb-2">No documents found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your filters to see more documents.'
                    : 'Upload your first document to get started with your knowledge base.'}
                </p>
                <Button asChild>
                  <Link href="/knowledge/documents/upload">
                    <UploadIcon size={16} />
                    <span className="ml-2">Upload Documents</span>
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </KnowledgeBaseLayout>
  );
}
