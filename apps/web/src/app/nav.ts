import { Megaphone, Repeat, Shield, Boxes, type LucideIcon } from 'lucide-react';

// Single source of truth for the sidebar — a module shows up here once
// it has at least a placeholder route, whether or not it's built yet.
export interface SubNavItem {
  path: string;
  label: string;
}

export interface NavItem {
  path: string;
  label: string;
  status: 'ready' | 'placeholder';
  icon: LucideIcon;
  /** Sub-routes rendered as an accordion under this item (e.g. Digital
   *  Twin's Photo Plan / Isometric Schema views). Empty for now. */
  subNav?: SubNavItem[];
}

export const navItems: NavItem[] = [
  { path: '/', label: 'Announcements', status: 'ready', icon: Megaphone },
  { path: '/handover', label: 'Handover', status: 'placeholder', icon: Repeat },
  { path: '/admin', label: 'Admin', status: 'placeholder', icon: Shield },
  { path: '/digital-twin', label: 'Digital Twin', status: 'placeholder', icon: Boxes },
];
