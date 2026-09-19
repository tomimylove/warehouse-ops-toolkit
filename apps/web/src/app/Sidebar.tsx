import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { navItems } from './nav';
import { useTheme } from './useTheme';
import './Sidebar.css';

const COLLAPSED_KEY = 'sidebar-collapsed';

// "Panel with divider" — the original app's standard sidebar-toggle icon.
function SidebarToggleIcon() {
  return (
    <svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3h18v18H3z M9 3v18" />
    </svg>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_KEY) === '1',
  );
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <nav className={`app-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="app-sidebar__header">
        {!collapsed && <span className="app-sidebar__brand">Warehouse Ops</span>}
        <button
          type="button"
          className="app-sidebar__icon-btn"
          onClick={() => setCollapsed((c) => !c)}
          data-tooltip={collapsed ? 'Expand' : undefined}
        >
          <SidebarToggleIcon />
        </button>
      </div>

      <ul>
        {navItems.map((item) => {
          const isOpenGroup = item.subNav && location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                end={item.path === '/'}
                data-tooltip={collapsed ? item.label : undefined}
              >
                <Icon size={17} strokeWidth={2} className="app-sidebar__icon" />
                {!collapsed && (
                  <>
                    <span className="app-sidebar__label">{item.label}</span>
                    {item.status === 'placeholder' && (
                      <span className="app-sidebar__soon">soon</span>
                    )}
                  </>
                )}
              </NavLink>

              {!collapsed && item.subNav && isOpenGroup && (
                <ul className="app-sidebar__subnav">
                  {item.subNav.map((sub) => (
                    <li key={sub.path}>
                      <NavLink
                        to={sub.path}
                        className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                      >
                        {sub.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        className="app-sidebar__theme-toggle"
        onClick={toggleTheme}
        data-tooltip={collapsed ? (theme === 'light' ? 'Dark mode' : 'Light mode') : undefined}
      >
        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        {!collapsed && <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>}
      </button>
    </nav>
  );
}
