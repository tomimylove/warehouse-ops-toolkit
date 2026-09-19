import type { ComponentType } from 'react';
import { ShieldAlert, FolderKanban, ListTodo, LayoutDashboard, BookOpen, Link2 } from 'lucide-react';
import { BellIcon, SwapIcon, CubeIcon, ShieldIcon } from './icons';

// Single source of truth for the sidebar — a module shows up here once
// it has at least a placeholder route, whether or not it's built yet.
// Order and grouping mirror the original app's sidebar structure
// (Inbox was tried and later removed there too — Решение 180):
// Announcements -> HSE -> Warehouse (Staff, Weekly meeting, Digital
// twin) -> Projects (Boards, TA27) -> Planner -> Dashboards ->
// Knowledge base -> Handover -> Links -> Admin (always last).
//
// Icon type matches lucide-react's component signature so both lucide
// icons and our custom path icons (./icons.tsx) drop in interchangeably.
type IconComponent = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

export interface SubNavItem {
  path: string;
  label: string;
}

export interface NavItem {
  path: string;
  label: string;
  status: 'ready' | 'placeholder';
  icon: IconComponent;
  /** A group with children is a pure expand/collapse toggle in the
   *  sidebar (like the original app's nav-group-toggle) — it has no
   *  route of its own, only its children do. */
  subNav?: SubNavItem[];
}

export const navItems: NavItem[] = [
  { path: '/', label: 'Announcements', status: 'ready', icon: BellIcon },
  { path: '/hse', label: 'HSE', status: 'placeholder', icon: ShieldAlert },
  {
    path: '/warehouse',
    label: 'Warehouse',
    status: 'placeholder',
    icon: CubeIcon,
    subNav: [
      { path: '/warehouse/staff', label: 'Staff' },
      { path: '/warehouse/weekly-meeting', label: 'Weekly meeting' },
      { path: '/warehouse/digital-twin', label: 'Digital twin' },
    ],
  },
  {
    path: '/projects',
    label: 'Projects',
    status: 'placeholder',
    icon: FolderKanban,
    subNav: [
      { path: '/projects/boards', label: 'Boards' },
      { path: '/projects/ta27', label: 'TA27' },
    ],
  },
  { path: '/planner', label: 'Planner', status: 'placeholder', icon: ListTodo },
  { path: '/dashboards', label: 'Dashboards', status: 'placeholder', icon: LayoutDashboard },
  { path: '/knowledge-base', label: 'Knowledge base', status: 'placeholder', icon: BookOpen },
  { path: '/handover', label: 'Handover', status: 'placeholder', icon: SwapIcon },
  { path: '/links', label: 'Links', status: 'placeholder', icon: Link2 },
  { path: '/admin', label: 'Admin', status: 'placeholder', icon: ShieldIcon },
];
