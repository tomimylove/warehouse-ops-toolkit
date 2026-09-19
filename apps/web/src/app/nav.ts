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
  /** One or two letters shown when the sidebar is collapsed. Falls back to
   *  the label's first letter if omitted — every module gets a stub icon,
   *  nothing breaks if someone forgets to set one. */
  icon?: string;
  /** Sub-routes rendered as an accordion under this item (e.g. Digital
   *  Twin's Photo Plan / Isometric Schema views). Empty for now. */
  subNav?: SubNavItem[];
}

export const navItems: NavItem[] = [
  { path: '/', label: 'Announcements', status: 'ready', icon: 'A' },
  { path: '/handover', label: 'Handover', status: 'placeholder', icon: 'H' },
  { path: '/admin', label: 'Admin', status: 'placeholder', icon: 'AD' },
  { path: '/digital-twin', label: 'Digital Twin', status: 'placeholder', icon: 'DT' },
];
