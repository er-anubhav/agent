import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { 
  UploadIcon, 
  FileIcon, 
  MoreHorizontalIcon,
  LoaderIcon,
  EyeIcon,
  PencilEditIcon,
  TrashIcon 
} from "@/components/icons";

// Custom icons for search and filter
const SearchIcon = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const FilterIcon = ({ size = 16, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
  </svg>
);

// Mock data for documents
const documents = [
  {
    id: '1',
    name: 'Product Requirements Document.pdf',
    type: 'PDF',
    size: '2.4 MB',
    status: 'ready',
    uploadedAt: '2024-01-15T10:30:00Z',
    lastProcessed: '2024-01-15T10:32:00Z',
    source: 'upload',
    chunks: 24,
    tags: ['product', 'requirements']
  },
  {
    id: '2',
    name: 'API Documentation.md',
    type: 'Markdown',
    size: '1.2 MB',
    status: 'processing',
    uploadedAt: '2024-01-15T11:00:00Z',
    lastProcessed: null,
    source: 'upload',
    chunks: 0,
    tags: ['api', 'documentation']
  },
  {
    id: '3',
    name: 'Team Meeting Notes',
    type: 'Notion Page',
    size: '0.8 MB',
    status: 'ready',
    uploadedAt: '2024-01-14T15:20:00Z',
    lastProcessed: '2024-01-14T15:22:00Z',
    source: 'notion',
    chunks: 12,
    tags: ['meeting', 'team']
  },
  {
    id: '4',
    name: 'Design System Guidelines',
    type: 'Google Docs',
    size: '1.8 MB',
    status: 'error',
    uploadedAt: '2024-01-14T09:15:00Z',
    lastProcessed: '2024-01-14T09:17:00Z',
    source: 'google-drive',
    chunks: 0,
    tags: ['design', 'guidelines']
  }
];

const statusColors = {
  ready: 'bg-green-100 text-green-800',
  processing: 'bg-blue-100 text-blue-800',
  error: 'bg-red-100 text-red-800'
};

const sourceIcons = {
  upload: <UploadIcon size={14} />,
  notion: <div className="w-3 h-3 bg-black rounded-sm"></div>,
  'google-drive': <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatFileSize(bytes: string) {
  return bytes; // Already formatted in mock data
}

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Documents</h1>
          <p className="text-muted-foreground">
            Manage and organize your knowledge base documents
          </p>
        </div>
        <Button asChild>
          <Link href="/knowledge/documents/upload">
            <UploadIcon size={16} />
            <span className="ml-2">Upload Documents</span>
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <SearchIcon size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search documents..." 
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <FilterIcon size={16} />
              <span className="ml-2">Filter</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl">{documents.length}</div>
            <p className="text-sm text-muted-foreground">Total Documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl">
              {documents.filter(d => d.status === 'ready').length}
            </div>
            <p className="text-sm text-muted-foreground">Ready</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl">
              {documents.filter(d => d.status === 'processing').length}
            </div>
            <p className="text-sm text-muted-foreground">Processing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl">
              {documents.reduce((sum, doc) => sum + doc.chunks, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total Chunks</p>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Documents</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-muted/50">
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-muted-foreground">
                    <FileIcon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{doc.name}</h3>
                      <div className="flex items-center gap-1">
                        {sourceIcons[doc.source as keyof typeof sourceIcons]}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{doc.type}</span>
                      <span>{formatFileSize(doc.size)}</span>
                      <span>Uploaded {formatDate(doc.uploadedAt)}</span>
                      {doc.chunks > 0 && <span>{doc.chunks} chunks</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Tags */}
                  <div className="flex gap-1">
                    {doc.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {doc.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{doc.tags.length - 2}
                      </Badge>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {doc.status === 'processing' ? (
                      <div className="flex items-center gap-1">
                        <div className="animate-spin text-blue-500">
                          <LoaderIcon size={14} />
                        </div>
                        <span className="text-xs text-blue-500">Processing</span>
                      </div>
                    ) : (
                      <Badge 
                        className={`text-xs ${statusColors[doc.status as keyof typeof statusColors]}`}
                        variant="secondary"
                      >
                        {doc.status}
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontalIcon size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <EyeIcon size={14} />
                        <span className="ml-2">View</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <PencilEditIcon size={14} />
                        <span className="ml-2">Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <TrashIcon size={14} />
                        <span className="ml-2">Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing 1-{documents.length} of {documents.length} documents
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
