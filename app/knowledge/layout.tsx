import { cookies } from 'next/headers';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '../(auth)/auth';

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <SidebarProvider defaultOpen={!isCollapsed}>
      <AppSidebar user={session?.user} />
      <SidebarInset>
        <div className="p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
