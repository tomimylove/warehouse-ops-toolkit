import { NavLink } from 'react-router-dom';
import { navItems } from './nav';
import './Sidebar.css';

export function Sidebar() {
  return (
    <nav className="app-sidebar">
      <div className="app-sidebar__brand">Warehouse Ops</div>
      <ul>
        {navItems.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) => (isActive ? 'is-active' : undefined)}
              end={item.path === '/'}
            >
              {item.label}
              {item.status === 'placeholder' && <span className="app-sidebar__soon">soon</span>}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
