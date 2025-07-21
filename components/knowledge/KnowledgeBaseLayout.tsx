'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { KnowledgeBaseSidebar } from '@/components/knowledge/KnowledgeBaseSidebar';

interface KnowledgeBaseLayoutProps {
  children: React.ReactNode;
}

export function KnowledgeBaseLayout({ children }: KnowledgeBaseLayoutProps) {
  return (
    <div className="flex h-screen">
      <SidebarProvider>
        <KnowledgeBaseSidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </SidebarProvider>
    </div>
  );
}
