'use client';

import { useState } from 'react';
import { useKnowledgeFiles, useConnectorFiles } from '@/hooks/use-knowledge-files';
import { Button } from '@/components/ui/button';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { 
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ChevronDownIcon, ChevronRightIcon, RefreshCwIcon } from '@/components/icons';

// File type icons
const FileIcon = ({ type, size = 16 }: { type: string; size?: number }) => {
  const iconMap = {
    pdf: '📄',
    docx: '📝', 
    txt: '📃',
    md: '📋',
    url: '🔗',
    notion: '📋',
    gdocs: '📄',
    github: '📁',
  };

  return (
    <span className="text-sm">
      {iconMap[type as keyof typeof iconMap] || '📄'}
    </span>
  );
};

const ConnectorIcon = ({ connector, size = 16 }: { connector: string; size?: number }) => {
  const iconMap = {
    notion: '📋',
    'google-drive': '💾',
    github: '📁',
    'web-crawler': '🕷️',
  };

  return (
    <span className="text-sm">
      {iconMap[connector as keyof typeof iconMap] || '🔗'}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const statusConfig = {
    completed: { variant: 'default' as const, label: 'Ready' },
    synced: { variant: 'default' as const, label: 'Synced' },
    processing: { variant: 'secondary' as const, label: 'Processing' },
    syncing: { variant: 'secondary' as const, label: 'Syncing' },
    pending: { variant: 'outline' as const, label: 'Pending' },
    failed: { variant: 'destructive' as const, label: 'Failed' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || 
    { variant: 'outline' as const, label: status };

  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toISOString().split('T')[0];
};

export function KnowledgeFilesSection() {
  const [isOpen, setIsOpen] = useState(true);
  const { files, loading, error, refreshFiles } = useKnowledgeFiles();

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center justify-between px-2 py-1">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-start p-0">
            <div className="flex items-center gap-2">
              {isOpen ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
              <span className="text-sm font-medium">Documents</span>
              {files.length > 0 && (
                <Badge variant="secondary" className="text-xs ml-auto">
                  {files.length}
                </Badge>
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={(e) => {
            e.stopPropagation();
            refreshFiles();
          }}
          disabled={loading}
        >
          <span className={cn(loading && 'animate-spin')}><RefreshCwIcon size={12} /></span>
        </Button>
      </div>

      <CollapsibleContent>
        <SidebarMenu className="px-1">
          {error && (
            <div className="px-2 py-1 text-xs text-muted-foreground">
              {error}
            </div>
          )}
          
          {loading && files.length === 0 && (
            <div className="px-2 py-1 text-xs text-muted-foreground">
              Loading files...
            </div>
          )}

          {!loading && files.length === 0 && !error && (
            <div className="px-2 py-1 text-xs text-muted-foreground">
              No documents uploaded
            </div>
          )}

          {files.slice(0, 10).map((file) => (
            <SidebarMenuItem key={file.id}>
              <SidebarMenuButton
                asChild
                className="h-auto py-2 cursor-pointer"
                title={`${file.title}\nType: ${file.type}\nStatus: ${file.status}\nUploaded: ${formatDate(file.uploadedAt)}`}
              >
                <div className="flex items-start gap-2 w-full">
                  <FileIcon type={file.type} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">
                      {file.title || 'Untitled'}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={file.status} />
                      {file.size && (
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}

          {files.length > 10 && (
            <SidebarMenuItem>
              <div className="px-2 py-1 text-xs text-muted-foreground">
                +{files.length - 10} more files
              </div>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  );
}

