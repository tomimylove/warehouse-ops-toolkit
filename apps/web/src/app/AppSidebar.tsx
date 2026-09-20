import { ChevronRight, Moon, Sun, Warehouse as BrandIcon } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { navItems } from './nav';
import { useTheme } from './useTheme';
import { usePermissions } from './PermissionsContext';

export function AppSidebar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { has, loading } = usePermissions();
  // Nothing renders as "missing" while /me is still in flight — an item
  // pops in once allowed, it never flashes and then disappears.
  const visibleItems = loading ? [] : navItems.filter((item) => has(item.permission));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <NavLink to="/">
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <BrandIcon className="size-4" />
                </div>
                <span className="truncate font-semibold">Warehouse Ops</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const Icon = item.icon;

                if (item.subNav) {
                  const groupActive = item.subNav.some((sub) => location.pathname === sub.path);
                  return (
                    <Collapsible key={item.path} defaultOpen={groupActive} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton isActive={groupActive} tooltip={item.label}>
                            <Icon />
                            <span>{item.label}</span>
                            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subNav.map((sub) => (
                              <SidebarMenuSubItem key={sub.path}>
                                <SidebarMenuSubButton asChild isActive={location.pathname === sub.path}>
                                  <NavLink to={sub.path}>
                                    <span>{sub.label}</span>
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path)}
                      tooltip={item.label}
                    >
                      <NavLink to={item.path}>
                        <Icon />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                    {item.status === 'placeholder' && (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground absolute top-1.5 right-2 h-4 px-1 text-[10px] font-mono uppercase group-data-[collapsible=icon]:hidden"
                      >
                        soon
                      </Badge>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleTheme} tooltip={theme === 'light' ? 'Dark mode' : 'Light mode'}>
              {theme === 'light' ? <Moon /> : <Sun />}
              <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
