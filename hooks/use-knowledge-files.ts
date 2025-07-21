import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface KnowledgeFile {
  id: string;
  title: string;
  type: 'pdf' | 'docx' | 'txt' | 'md' | 'url' | 'notion' | 'gdocs' | 'github';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploadedAt: string;
  size?: number;
  chunks?: number;
  source?: string;
  metadata?: {
    pages?: number;
    author?: string;
    language?: string;
    url?: string;
  };
}

export interface ConnectorSyncFile {
  id: string;
  name: string;
  connector: 'notion' | 'google-drive' | 'github' | 'web-crawler';
  status: 'synced' | 'syncing' | 'failed' | 'pending';
  lastSyncedAt?: string;
  size?: number;
  url?: string;
  metadata?: {
    pageId?: string;
    driveId?: string;
    repoPath?: string;
  };
}

export function useKnowledgeFiles() {
  const { data: session } = useSession();
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    if (!session?.user) {
      setFiles([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/knowledge/api/documents?limit=50');
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view your files');
        }
        throw new Error('Failed to fetch files');
      }

      const data = await response.json();
      setFiles(data.documents || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load files';
      setError(errorMessage);
      console.error('Failed to fetch knowledge files:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  const deleteFile = useCallback(async (fileId: string) => {
    try {
      const response = await fetch(`/knowledge/api/documents?id=${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete file');
      }

      // Remove from local state
      setFiles(prev => prev.filter(file => file.id !== fileId));
      return true;
    } catch (err) {
      console.error('Failed to delete file:', err);
      return false;
    }
  }, []);

  const refreshFiles = useCallback(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return {
    files,
    loading,
    error,
    deleteFile,
    refreshFiles,
  };
}

export function useConnectorFiles() {
  const { data: session } = useSession();
  const [files, setFiles] = useState<ConnectorSyncFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnectorFiles = useCallback(async () => {
    if (!session?.user) {
      setFiles([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/knowledge/api/connectors/files?limit=50');
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please sign in to view connector files');
        }
        throw new Error('Failed to fetch connector files');
      }

      const data = await response.json();
      setFiles(data.files || []);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load connector files';
      setError(errorMessage);
      console.error('Failed to fetch connector files:', err);
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  const syncConnectorFile = useCallback(async (fileId: string, connector: string) => {
    try {
      // Update local state to show syncing status
      setFiles(prev => prev.map(file => 
        file.id === fileId ? { ...file, status: 'syncing' } : file
      ));

      const response = await fetch('/knowledge/api/connectors/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, action: 'sync' }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync file');
      }

      // Update to synced status
      setFiles(prev => prev.map(file => 
        file.id === fileId 
          ? { ...file, status: 'synced', lastSyncedAt: new Date().toISOString() }
          : file
      ));

      return true;
    } catch (err) {
      console.error('Failed to sync file:', err);
      // Revert status on error
      setFiles(prev => prev.map(file => 
        file.id === fileId ? { ...file, status: 'failed' } : file
      ));
      return false;
    }
  }, []);

  const refreshConnectorFiles = useCallback(() => {
    fetchConnectorFiles();
  }, [fetchConnectorFiles]);

  useEffect(() => {
    fetchConnectorFiles();
  }, [fetchConnectorFiles]);

  return {
    files,
    loading,
    error,
    syncConnectorFile,
    refreshFiles: refreshConnectorFiles,
  };
}
