// Single source of truth for the sidebar — a module shows up here once
// it has at least a placeholder route, whether or not it's built yet.
export interface NavItem {
  path: string;
  label: string;
  status: 'ready' | 'placeholder';
}

export const navItems: NavItem[] = [
  { path: '/', label: 'Announcements', status: 'ready' },
  { path: '/handover', label: 'Handover', status: 'placeholder' },
  { path: '/admin', label: 'Admin', status: 'placeholder' },
  { path: '/digital-twin', label: 'Digital Twin', status: 'placeholder' },
];
