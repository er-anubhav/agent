"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useState } from "react";
import { 
  UploadIcon, 
  FileIcon, 
  LoaderIcon 
} from "@/components/icons";

// Custom icons
const XIcon = ({ size = 16 }: { size?: number }) => (
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
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

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

// Custom icons
const CloudUploadIcon = ({ size = 16 }: { size?: number }) => (
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
    <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
    <path d="M12 12v9" />
    <path d="m16 16-4-4-4 4" />
  </svg>
);

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'uploaded' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
}

export default function DocumentUploadPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type || 'unknown',
      status: 'uploading',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Process each file with real upload
    for (const file of Array.from(fileList)) {
      const fileId = newFiles.find(f => f.name === file.name)?.id;
      if (!fileId) continue;

      try {
        // Convert file to base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Content = reader.result as string;
          const base64Data = base64Content.split(',')[1]; // Remove data:... prefix

          // Get current processing options
          const chunkSizeSelect = document.getElementById('chunk-size') as HTMLSelectElement;
          const overlapSelect = document.getElementById('overlap') as HTMLSelectElement;
          const tagsInput = document.getElementById('tags') as HTMLInputElement;

          const chunkSize = parseInt(chunkSizeSelect?.value || '1000');
          const chunkOverlap = parseInt(overlapSelect?.value || '200');
          const tags = tagsInput?.value?.split(',').map(t => t.trim()).filter(Boolean) || [];

          // Update progress to show upload starting
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress: 10, status: 'uploading' } : f
          ));

          // Call upload API
          const response = await fetch('/knowledge/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              files: [{
                name: file.name,
                type: file.type,
                size: file.size,
                content: base64Data,
              }],
              config: {
                chunkSize,
                chunkOverlap,
                tags,
              },
            }),
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          const result = await response.json();
          
          if (result.success) {
            // Update file status based on API response
            const fileResult = result.results?.[0];
            if (fileResult?.success) {
              setFiles(prev => prev.map(f => 
                f.id === fileId ? { 
                  ...f, 
                  progress: 100, 
                  status: 'completed' 
                } : f
              ));
            } else {
              setFiles(prev => prev.map(f => 
                f.id === fileId ? { 
                  ...f, 
                  status: 'error',
                  error: fileResult?.error || 'Processing failed'
                } : f
              ));
            }
          } else {
            throw new Error(result.error || 'Upload failed');
          }
        };

        reader.onerror = () => {
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { 
              ...f, 
              status: 'error',
              error: 'Failed to read file'
            } : f
          ));
        };

        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Upload error:', error);
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { 
            ...f, 
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed'
          } : f
        ));
      }
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'uploading': return 'bg-blue-100 text-blue-800';
      case 'uploaded': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Upload Documents</h1>
          <p className="text-muted-foreground">
            Add new documents to your knowledge base
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/knowledge/documents">
            Back to Documents
          </Link>
        </Button>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-muted">
                <CloudUploadIcon size={32} />
              </div>
              <div>
                <h3 className="text-lg font-medium">Drop files here to upload</h3>
                <p className="text-muted-foreground">
                  or click to browse files from your computer
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  Choose Files
                </Button>
                <Button variant="outline">
                  Import from URL
                </Button>
              </div>
              <input
                id="file-input"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                accept=".pdf,.doc,.docx,.txt,.md,.json,.csv,.xlsx,.pptx"
              />
            </div>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p className="font-medium mb-2">Supported formats:</p>
            <div className="flex flex-wrap gap-2">
              {['PDF', 'DOC', 'DOCX', 'TXT', 'MD', 'JSON', 'CSV', 'XLSX', 'PPTX'].map(format => (
                <Badge key={format} variant="secondary" className="text-xs">
                  {format}
                </Badge>
              ))}
            </div>
            <p className="mt-2">Maximum file size: 50MB per file</p>
          </div>
        </CardContent>
      </Card>

      {/* Upload Options */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chunk-size">Chunk Size</Label>
              <Select defaultValue="1000">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="500">500 tokens</SelectItem>
                  <SelectItem value="1000">1,000 tokens</SelectItem>
                  <SelectItem value="1500">1,500 tokens</SelectItem>
                  <SelectItem value="2000">2,000 tokens</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="overlap">Overlap</Label>
              <Select defaultValue="200">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 tokens</SelectItem>
                  <SelectItem value="200">200 tokens</SelectItem>
                  <SelectItem value="300">300 tokens</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <Input 
              id="tags"
              placeholder="Add tags separated by commas..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="text-muted-foreground">
                    <FileIcon size={20} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium truncate">{file.name}</h4>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getStatusColor(file.status)}`}
                      >
                        {file.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)} • {file.type}
                    </p>
                    
                    {(file.status === 'uploading' || file.status === 'processing') && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>{file.status === 'uploading' ? 'Uploading...' : 'Processing...'}</span>
                          <span>{Math.round(file.progress)}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {file.status === 'completed' && (
                      <div className="text-green-600">
                        <CheckIcon size={20} />
                      </div>
                    )}
                    {file.status === 'processing' && (
                      <div className="animate-spin text-blue-500">
                        <LoaderIcon size={20} />
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <XIcon size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {files.some(f => f.status === 'completed') && (
              <div className="mt-6 flex justify-end">
                <Button asChild>
                  <Link href="/knowledge/documents">
                    View Documents
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
