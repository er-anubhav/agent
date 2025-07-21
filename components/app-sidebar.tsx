'use client';

import type { User } from 'next-auth';
import { useRouter, usePathname } from 'next/navigation';

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { KnowledgeFilesSection } from '@/components/knowledge-files-sidebar';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { cn } from '@/lib/utils';

// Knowledge base navigation icons
const BookIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const ConnectorIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

const FileIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

const knowledgeNavigationItems = [
  {
    name: 'Overview',
    href: '/knowledge',
    icon: BookIcon,
  },
  {
    name: 'Documents',
    href: '/knowledge/documents',
    icon: FileIcon,
  },
  {
    name: 'Connectors',
    href: '/knowledge/connectors',
    icon: ConnectorIcon,
  }
];

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  
  const isInKnowledgeBase = pathname.startsWith('/knowledge');

  return (
    <Sidebar className="group-data-[side=left]:border-r-0">
      <SidebarHeader>
        <SidebarMenu>
          <div className="flex flex-row justify-between items-center">
            <Link
              href="/"
              onClick={() => {
                setOpenMobile(false);
              }}
              className="flex flex-row gap-3 items-center"
            >
              <span className="text-lg px-2 hover:bg-muted rounded-md cursor-pointer">
                Chatbot
              </span>
            </Link>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  type="button"
                  className="p-2 h-fit"
                  onClick={() => {
                    setOpenMobile(false);
                    router.push('/');
                    router.refresh();
                  }}
                >
                  <PlusIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent align="end">New Chat</TooltipContent>
            </Tooltip>
          </div>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {isInKnowledgeBase ? (
          // Knowledge Base Navigation
          <div className="px-2">
            <div className="mb-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link
                  href="/"
                  onClick={() => setOpenMobile(false)}
                >
                  <span className="mr-2">💬</span>
                  Back to Chat
                </Link>
              </Button>
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">Knowledge Base</h3>
              <SidebarMenu>
                {knowledgeNavigationItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton asChild>
                        <Link
                          href={item.href}
                          onClick={() => setOpenMobile(false)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : 'hover:bg-muted'
                          )}
                        >
                          <Icon size={16} />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>

            {/* Knowledge Base Files */}
            <div className="mb-4">
              <KnowledgeFilesSection />
            </div>
          </div>
        ) : (
          // Chat Navigation
          <>
            <div className="px-2 mb-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link
                  href="/knowledge"
                  onClick={() => setOpenMobile(false)}
                >
                  <span className="mr-2">📚</span>
                  Knowledge Base
                </Link>
              </Button>
            </div>
            <SidebarHistory user={user} />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
