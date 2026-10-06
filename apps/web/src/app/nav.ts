import { Megaphone, Boxes, ListChecks, BookOpen, Shield, type LucideIcon } from 'lucide-react';

// Single source of truth for the sidebar — a module shows up here once
// it has at least a placeholder route, whether or not it's built yet.
//
// Navigation 2.0 (specs/ARCHITECTURE.md, раздел 12) — YouGile-inspired
// restructure: Announcements -> Operations (HSE, Staff, Weekly meeting,
// Digital twin, Dashboards, Links) -> Tasks (replaces Projects+Planner)
// -> Knowledge base -> Admin (always last).
//
// Profile is NOT in this list — it's the account switcher in the sidebar
// footer (avatar + name, see NavUserFooter.tsx), not a regular nav item,
// same as the original app's user block. Its route (/profile) and
// permission key ('profile:view') still exist, just gated/rendered from
// the footer instead of this list.
//
// Notes is also deliberately not here — it opens from the floating
// quick-note button (QuickNoteFab, rendered by AppShell on every screen),
// not a sidebar entry or a route.
//
// Every item carries the permission key that must be present for it to
// show at all — this is not just a UI nicety: RequirePermission blocks
// the matching route the same way, so a direct link doesn't work either.
// A group (subNav present) is gated by one key covering the whole group;
// once a child module is actually built it gets its own key and the
// group splits per-child.
export interface SubNavItem {
  path: string;
  label: string;
}

export interface NavItem {
  path: string;
  label: string;
  status: 'ready' | 'placeholder';
  icon: LucideIcon;
  permission: string;
  /** A group with children is a pure expand/collapse toggle in the
   *  sidebar — it has no route of its own, only its children do. */
  subNav?: SubNavItem[];
}

export const navItems: NavItem[] = [
  { path: '/', label: 'Announcements', status: 'ready', icon: Megaphone, permission: 'announcements:view' },
  {
    path: '/operations',
    label: 'Operations',
    status: 'placeholder',
    icon: Boxes,
    permission: 'operations:view',
    subNav: [
      { path: '/operations/hse', label: 'HSE' },
      { path: '/operations/staff', label: 'Staff' },
      { path: '/operations/weekly-meeting', label: 'Weekly meeting' },
      { path: '/operations/digital-twin', label: 'Digital twin' },
      { path: '/operations/dashboards', label: 'Dashboards' },
      { path: '/operations/links', label: 'Links' },
    ],
  },
  // Nav label only — route, module, DTOs, and the tasks:* permission keys
  // stay as-is (user's call: rename the sidebar text, not the plumbing).
  { path: '/tasks', label: 'Projects', status: 'placeholder', icon: ListChecks, permission: 'tasks:view' },
  {
    path: '/knowledge-base',
    label: 'Knowledge base',
    status: 'placeholder',
    icon: BookOpen,
    permission: 'knowledge-base:view',
  },
  { path: '/admin', label: 'Admin', status: 'placeholder', icon: Shield, permission: 'admin:view' },
];
