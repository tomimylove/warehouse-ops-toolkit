import {
  Bell,
  Inbox,
  ShieldAlert,
  Warehouse,
  FolderKanban,
  ListTodo,
  LayoutDashboard,
  BookOpen,
  Repeat,
  Link2,
  Shield,
  type LucideIcon,
} from 'lucide-react';

// Single source of truth for the sidebar — a module shows up here once
// it has at least a placeholder route, whether or not it's built yet.
// Order and grouping mirror the original app's sidebar structure:
// Announcements -> Inbox -> HSE -> Warehouse (Staff, Weekly meeting,
// Digital twin) -> Projects (Boards, TA27) -> Planner -> Dashboards ->
// Knowledge base -> Handover -> Links -> Admin (always last).
export interface SubNavItem {
  path: string;
  label: string;
}

export interface NavItem {
  path: string;
  label: string;
  status: 'ready' | 'placeholder';
  icon: LucideIcon;
  /** Sub-routes rendered as an accordion under this item (e.g. Warehouse's
   *  Staff / Weekly meeting / Digital twin, or Projects' Boards / TA27). */
  subNav?: SubNavItem[];
}

export const navItems: NavItem[] = [
  { path: '/', label: 'Announcements', status: 'ready', icon: Bell },
  { path: '/inbox', label: 'Inbox', status: 'placeholder', icon: Inbox },
  { path: '/hse', label: 'HSE', status: 'placeholder', icon: ShieldAlert },
  {
    path: '/warehouse',
    label: 'Warehouse',
    status: 'placeholder',
    icon: Warehouse,
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
  { path: '/handover', label: 'Handover', status: 'placeholder', icon: Repeat },
  { path: '/links', label: 'Links', status: 'placeholder', icon: Link2 },
  { path: '/admin', label: 'Admin', status: 'placeholder', icon: Shield },
];
