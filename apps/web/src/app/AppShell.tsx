import type { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { usePermissions } from './PermissionsContext';
import { QuickNoteFab } from '../features/tasks/QuickNotes';

function GlobalOverlays() {
  const { has } = usePermissions();
  return has('tasks:view') ? <QuickNoteFab /> : null;
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-1 flex-col p-6">{children}</div>
        </SidebarInset>
        <GlobalOverlays />
      </SidebarProvider>
    </TooltipProvider>
  );
}
