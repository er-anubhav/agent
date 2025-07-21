import React from 'react';

export interface DocumentPreviewItem {
  source: string;
  extractedText: string;
  extractionError: string | null;
}

interface DocumentUploadPreviewProps {
  documents: DocumentPreviewItem[];
}

export const DocumentUploadPreview: React.FC<DocumentUploadPreviewProps> = ({ documents }) => {
  if (!documents || documents.length === 0) return null;

  return (
    <div className="space-y-4 mt-4">
      {documents.map((doc, idx) => (
        <div key={idx} className="border rounded-lg p-4 bg-muted">
          <div className="font-semibold text-sm mb-2">{doc.source}</div>
          {doc.extractionError ? (
            <div className="text-red-500 text-xs mb-2">Error: {doc.extractionError}</div>
          ) : null}
          <div className="text-xs whitespace-pre-line max-h-40 overflow-y-auto">
            {doc.extractedText ? doc.extractedText.slice(0, 1000) + (doc.extractedText.length > 1000 ? '... (truncated)' : '') : <span className="text-muted-foreground">No text extracted.</span>}
          </div>
        </div>
      ))}
    </div>
  );
};
