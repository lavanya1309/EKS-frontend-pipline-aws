import { Link, useLocation } from 'react-router-dom'
import './Sidebar.css'

function Sidebar({ activeMenu, onMenuChange }) {
  const location = useLocation()
  const currentPath = location.pathname.split('/').pop() || 'dashboard'

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { id: 'menu', label: 'Menu Management', icon: '🍽️', path: '/dashboard/menu' },
    { id: 'orders', label: 'Orders', icon: '📋', path: '/dashboard/orders' },
    { id: 'tables', label: 'Tables', icon: '🪑', path: '/dashboard/tables' },
    { id: 'reservations', label: 'Reservations', icon: '📅', path: '/dashboard/reservations' },
    { id: 'staff', label: 'Staff', icon: '👥', path: '/dashboard/staff' },
    { id: 'inventory', label: 'Inventory', icon: '📦', path: '/dashboard/inventory' },
    { id: 'reports', label: 'Reports', icon: '📈', path: '/dashboard/reports' },
    { id: 'settings', label: 'Settings', icon: '⚙️', path: '/dashboard/settings' }
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const isActive = currentPath === item.id || (location.pathname === '/dashboard' && item.id === 'dashboard')
            return (
              <li key={item.id} className="sidebar-menu-item">
                <Link
                  to={item.path}
                  className={`sidebar-menu-button ${isActive ? 'active' : ''}`}
                  onClick={() => onMenuChange(item.id)}
                >
                  <span className="sidebar-menu-icon">{item.icon}</span>
                  <span className="sidebar-menu-label">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}

export default Sidebar

