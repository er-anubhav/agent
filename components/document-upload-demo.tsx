import React, { useState } from 'react';
import { DocumentUploadPreview, DocumentPreviewItem } from './document-upload-preview';

export const DocumentUploadDemo: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentPreviewItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real upload handler for ingestion API
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      // Read all files as text/base64 and build sources array
      const sources = await Promise.all(Array.from(files).map(async (file) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        let text = '';
        if (['txt', 'md'].includes(ext || '')) {
          text = await file.text();
        } else if (['pdf', 'docx'].includes(ext || '')) {
          // Read as base64 for binary files
          const buffer = await file.arrayBuffer();
          text = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        }
        return {
          type: 'file',
          path: file.name,
          text,
          metadata: {
            size: file.size,
            type: ext,
            lastModified: file.lastModified,
          },
        };
      }));

      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sources }),
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h2 className="text-lg font-bold mb-4">Document Upload Demo</h2>
      <input type="file" multiple onChange={handleUpload} className="mb-4" />
      {uploading && <div className="text-sm text-muted-foreground mb-2">Uploading...</div>}
      {error && <div className="text-red-500 text-xs mb-2">{error}</div>}
      <DocumentUploadPreview documents={documents} />
    </div>
  );
};
