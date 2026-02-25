import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Dashboard from './Dashboard'
import MenuManagement from './MenuManagement'
import Orders from './Orders'
import Tables from './Tables'
import Reservations from './Reservations'
import Staff from './Staff'
import Inventory from './Inventory'
import Reports from './Reports'
import Settings from './Settings'
import './Layout.css'

function Layout() {
  const [activeMenu, setActiveMenu] = useState('dashboard')

  return (
    <div className="layout">
      <Navbar />
      <div className="layout-body">
        <Sidebar activeMenu={activeMenu} onMenuChange={setActiveMenu} />
        <main className="main-content">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="orders" element={<Orders />} />
            <Route path="tables" element={<Tables />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="staff" element={<Staff />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default Layout

