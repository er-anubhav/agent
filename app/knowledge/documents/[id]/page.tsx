"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileIcon, DownloadIcon, ShareIcon, PencilEditIcon, ChevronLeftIcon } from "@/components/icons";

export default function DocumentViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [document, setDocument] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDocument() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/knowledge/api/documents/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch document");
        }
        const data = await response.json();
        setDocument(data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch document");
      } finally {
        setLoading(false);
      }
    }
    fetchDocument();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading document...</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }
  if (!document) {
    return <div className="p-8 text-center text-muted-foreground">Document not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/knowledge/documents">
              <ChevronLeftIcon size={16} />
              <span className="ml-1">Back</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl">{document.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              <span>{document.type}</span>
              <span>{document.size}</span>
              <span>Uploaded {formatDate(document.uploadedAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ShareIcon size={16} />
            <span className="ml-2">Share</span>
          </Button>
          <Button variant="outline" size="sm">
            <DownloadIcon size={16} />
            <span className="ml-2">Download</span>
          </Button>
          <Button variant="outline" size="sm">
            <PencilEditIcon size={16} />
            <span className="ml-2">Edit</span>
          </Button>
        </div>
      </div>
      {/* Document Info */}
      <Card>
        <CardContent className="p-4">
          <div className="mb-2">
            <span className="font-semibold">Title:</span> {document.title}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Type:</span> {document.type}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Size:</span> {document.size}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Uploaded:</span> {formatDate(document.uploadedAt)}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Status:</span> {document.status}
          </div>
          <div className="mb-2">
            <span className="font-semibold">Chunks:</span> {document.chunks}
          </div>
        </CardContent>
      </Card>
      {/* Document Content */}
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {document.content && document.content.trim().length > 0 ? (
            <div>
              {document.metadata?.multiMethodExtraction && (
                <div className="mb-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                  ✅ Content extracted using multiple AI methods (OCR + LLM) and merged
                </div>
              )}
              {document.metadata?.llm && !document.metadata?.multiMethodExtraction && (
                <div className="mb-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  ℹ️ Content extracted using AI (LLM fallback)
                </div>
              )}
              {document.metadata?.ocr && !document.metadata?.multiMethodExtraction && (
                <div className="mb-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                  ℹ️ Content extracted using OCR
                </div>
              )}
              <pre className="whitespace-pre-wrap text-xs bg-muted p-2 rounded-lg max-h-96 overflow-y-auto">
                {document.content}
              </pre>
            </div>
          ) : (
            <div className="text-red-500 text-sm">
              Content extraction failed.
              {document.metadata?.extractionError && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="font-semibold">Error:</span> {document.metadata.extractionError}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
