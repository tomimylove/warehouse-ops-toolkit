import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { navItems } from './nav';
import './Sidebar.css';

const COLLAPSED_KEY = 'sidebar-collapsed';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_KEY) === '1',
  );
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <nav className={`app-sidebar ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="app-sidebar__brand">{collapsed ? 'WO' : 'Warehouse Ops'}</div>

      <ul>
        {navItems.map((item) => {
          const isOpenGroup = item.subNav && location.pathname.startsWith(item.path);
          return (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                end={item.path === '/'}
                data-tooltip={collapsed ? item.label : undefined}
              >
                <span className="app-sidebar__icon">{item.icon ?? item.label[0]}</span>
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
        className="app-sidebar__toggle"
        onClick={() => setCollapsed((c) => !c)}
        data-tooltip={collapsed ? 'Expand' : undefined}
      >
        {collapsed ? '»' : '« Collapse'}
      </button>
    </nav>
  );
}
