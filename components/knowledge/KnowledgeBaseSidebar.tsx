import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { HomeIcon, FileIcon } from '@/components/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// Simple custom icons for missing ones
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

const navigationItems = [
  {
    name: 'Overview',
    href: '/knowledge',
    icon: BookIcon,
  },
  {
    name: 'Documents',
    href: '/knowledge/sources',
    icon: FileIcon,
  },
  {
    name: 'Connectors',
    href: '/knowledge/connectors',
    icon: ConnectorIcon,
  },
];

export function KnowledgeBaseSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="w-64 border-r">
      <SidebarHeader className="p-4">
        <h2 className="text-lg">Knowledge Base</h2>
        <p className="text-sm text-muted-foreground">
          Manage your documents and data sources
        </p>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu>
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
