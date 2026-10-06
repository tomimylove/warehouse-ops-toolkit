import { useEffect, useState } from 'react';
import { ChevronRight, Warehouse as BrandIcon } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { navItems, type SubNavItem } from './nav';
import { usePermissions } from './PermissionsContext';
import { NavUserFooter } from './NavUserFooter';
import { tasksApi } from '../features/tasks/api';

export function AppSidebar() {
  const location = useLocation();
  const { has, loading } = usePermissions();
  const { state } = useSidebar();
  // Nothing renders as "missing" while /me is still in flight — an item
  // pops in once allowed, it never flashes and then disappears.
  const visibleItems = loading ? [] : navItems.filter((item) => has(item.permission));

  // Projects are user-created records, not a fixed list like Operations'
  // children — fetched once permission is confirmed and kept fresh on
  // every Projects-area navigation (cheap: it's just id+name per project).
  const [projects, setProjects] = useState<SubNavItem[]>([]);
  const showsProjects = visibleItems.some((item) => item.dynamicChildren === 'projects');
  useEffect(() => {
    if (!showsProjects) return;
    tasksApi.listProjects().then((list) => setProjects(list.map((p) => ({ path: `/tasks/${p.id}`, label: p.name }))));
  }, [showsProjects, location.pathname]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-1">
            {state === 'collapsed' ? (
              // Collapsed rail has room for one icon — it's the trigger
              // itself (clicking re-expands), not the brand mark, so
              // there's always a visible way back to expanded.
              <SidebarTrigger className="size-8" />
            ) : (
              <>
                <SidebarMenuButton size="lg" asChild className="flex-1">
                  <NavLink to="/">
                    <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                      <BrandIcon className="size-4" />
                    </div>
                    <span className="truncate font-semibold">Warehouse Ops</span>
                  </NavLink>
                </SidebarMenuButton>
                <SidebarTrigger />
              </>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                const Icon = item.icon;

                if (item.dynamicChildren === 'projects') {
                  const groupActive = location.pathname.startsWith(item.path);

                  // Same flyout idea as a static subNav group when
                  // collapsed, but the trigger also opens straight to
                  // item.path (the project picker/create landing) via the
                  // first entry, since there's no separate click target
                  // for "just navigate" in the collapsed rail.
                  if (state === 'collapsed') {
                    return (
                      <SidebarMenuItem key={item.path}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                              isActive={groupActive}
                              tooltip={item.label}
                              className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            >
                              <Icon />
                              <span>{item.label}</span>
                            </SidebarMenuButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" align="start" className="w-48">
                            <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <NavLink to={item.path}>All projects</NavLink>
                            </DropdownMenuItem>
                            {projects.map((sub) => (
                              <DropdownMenuItem key={sub.path} asChild>
                                <NavLink to={sub.path}>{sub.label}</NavLink>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <Collapsible key={item.path} defaultOpen={groupActive} className="group/collapsible">
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          isActive={location.pathname === item.path}
                          tooltip={item.label}
                          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        >
                          <NavLink to={item.path}>
                            <Icon />
                            <span>{item.label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                        {projects.length > 0 && (
                          <CollapsibleTrigger asChild>
                            <SidebarMenuAction>
                              <ChevronRight className="transition-transform group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuAction>
                          </CollapsibleTrigger>
                        )}
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {projects.map((sub) => (
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

                if (item.subNav) {
                  const groupActive = item.subNav.some((sub) => location.pathname === sub.path);

                  // Collapsed rail has no room to expand inline — a click
                  // opens a flyout menu next to the icon instead (same
                  // idea as FSA's collapsed-group popover), rather than
                  // silently doing nothing.
                  if (state === 'collapsed') {
                    return (
                      <SidebarMenuItem key={item.path}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                              isActive={groupActive}
                              tooltip={item.label}
                              className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            >
                              <Icon />
                              <span>{item.label}</span>
                            </SidebarMenuButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="right" align="start" className="w-48">
                            <DropdownMenuLabel>{item.label}</DropdownMenuLabel>
                            {item.subNav.map((sub) => (
                              <DropdownMenuItem key={sub.path} asChild>
                                <NavLink to={sub.path}>{sub.label}</NavLink>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <Collapsible key={item.path} defaultOpen={groupActive} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            isActive={groupActive}
                            tooltip={item.label}
                            className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          >
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

      <NavUserFooter />
    </Sidebar>
  );
}
