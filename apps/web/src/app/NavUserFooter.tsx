import { ChevronDown, LogOut, UserRound } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarFooter, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { usePermissions } from './PermissionsContext';

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Account switcher, not a nav item — avatar+name go straight to /profile,
// the chevron opens Profile/Log out, same split as the original app's
// user block. Notification count has a reserved slot (currently unwired).
export function NavUserFooter() {
  const { user, has } = usePermissions();
  if (!user || !has('profile:view')) return null;

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem className="flex items-center gap-1">
          <NavLink
            to="/profile"
            className="hover:bg-sidebar-accent flex min-w-0 flex-1 items-center gap-2 rounded-md p-2 text-left group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2!"
          >
            <Avatar className="size-6 rounded-md">
              <AvatarFallback className="rounded-md text-xs">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <span className="group-data-[collapsible=icon]:hidden min-w-0 flex-1 truncate text-sm font-medium">
              {user.name}
            </span>
            {/* Reserved for an unread-count badge once notifications exist. */}
            <Badge variant="secondary" className="group-data-[collapsible=icon]:hidden hidden h-5 min-w-5 justify-center px-1">
              0
            </Badge>
          </NavLink>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="hover:bg-sidebar-accent group-data-[collapsible=icon]:hidden text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-md"
              >
                <ChevronDown className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-48">
              <DropdownMenuItem asChild>
                <NavLink to="/profile">
                  <UserRound />
                  Profile
                </NavLink>
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive">
                <LogOut />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}
