import { useState, useEffect } from 'react'
import api from '../services/api'
import './Reports.css'

function Reports() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalMenuItems: 0,
    totalStaff: 0,
    totalInventory: 0,
    lowStockItems: 0,
    pendingOrders: 0,
    completedOrders: 0
  })
  const [orders, setOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [inventoryItems, setInventoryItems] = useState([])

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      const restaurantId = 'restaurant-1'

      const [ordersRes, menuRes, inventoryRes] = await Promise.all([
        api.getOrders(restaurantId),
        api.getMenuItems(restaurantId),
        api.getInventoryItems(restaurantId)
      ])

      const ordersData = ordersRes.success ? ordersRes.data || [] : []
      const menuData = menuRes.success ? menuRes.data || [] : []
      const inventoryData = inventoryRes.success ? inventoryRes.data || [] : []

      setOrders(ordersData)
      setMenuItems(menuData)
      setInventoryItems(inventoryData)

      const totalRevenue = ordersData
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + (order.total || 0), 0)

      const lowStockItems = inventoryData.filter(item => {
        return item.quantity <= (item.minThreshold || 0)
      }).length

      const pendingOrders = ordersData.filter(order => 
        ['pending', 'preparing'].includes(order.status)
      ).length

      const completedOrders = ordersData.filter(order => 
        order.status === 'completed'
      ).length

      setStats({
        totalOrders: ordersData.length,
        totalRevenue: totalRevenue,
        totalMenuItems: menuData.length,
        totalStaff: 0,
        totalInventory: inventoryData.length,
        lowStockItems: lowStockItems,
        pendingOrders: pendingOrders,
        completedOrders: completedOrders
      })
    } catch (err) {
      console.error('Failed to load reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const getTopSellingItems = () => {
    const itemCounts = {}
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity
        })
      }
    })
    return Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))
  }

  const getOrdersByStatus = () => {
    const statusCounts = {}
    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1
    })
    return statusCounts
  }

  const getCategoryDistribution = () => {
    const categoryCounts = {}
    menuItems.forEach(item => {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
    })
    return categoryCounts
  }

  if (loading) {
    return <div className="loading">Loading reports...</div>
  }

  return (
    <div className="reports">
      <div className="reports-header">
        <h1>📈 Reports & Analytics</h1>
        <button className="btn-primary" onClick={loadReports}>
          Refresh Data
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>₹{stats.totalRevenue.toLocaleString()}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🍽️</div>
          <div className="stat-content">
            <h3>{stats.totalMenuItems}</h3>
            <p>Menu Items</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats.totalInventory}</h3>
            <p>Inventory Items</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>{stats.lowStockItems}</h3>
            <p>Low Stock Items</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingOrders}</h3>
            <p>Pending Orders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedOrders}</h3>
            <p>Completed Orders</p>
          </div>
        </div>
      </div>

      <div className="reports-grid">
        <div className="report-card">
          <h2>Top Selling Items</h2>
          {getTopSellingItems().length > 0 ? (
            <ul className="top-items-list">
              {getTopSellingItems().map((item, idx) => (
                <li key={idx} className="top-item">
                  <span className="item-rank">#{idx + 1}</span>
                  <span className="item-name">{item.name}</span>
                  <span className="item-count">{item.count} sold</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-data">No sales data available</p>
          )}
        </div>

        <div className="report-card">
          <h2>Orders by Status</h2>
          {Object.keys(getOrdersByStatus()).length > 0 ? (
            <div className="status-chart">
              {Object.entries(getOrdersByStatus()).map(([status, count]) => (
                <div key={status} className="status-bar">
                  <div className="status-label">{status}</div>
                  <div className="status-bar-container">
                    <div
                      className="status-bar-fill"
                      style={{
                        width: `${(count / stats.totalOrders) * 100}%`,
                        backgroundColor: status === 'completed' ? '#10b981' : 
                                        status === 'pending' ? '#f59e0b' : 
                                        status === 'preparing' ? '#3b82f6' : '#6b7280'
                      }}
                    />
                    <span className="status-count">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No orders data available</p>
          )}
        </div>

        <div className="report-card">
          <h2>Menu Categories</h2>
          {Object.keys(getCategoryDistribution()).length > 0 ? (
            <div className="category-list">
              {Object.entries(getCategoryDistribution()).map(([category, count]) => (
                <div key={category} className="category-item">
                  <span className="category-name">{category}</span>
                  <span className="category-count">{count} items</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No menu data available</p>
          )}
        </div>

        <div className="report-card">
          <h2>Low Stock Alert</h2>
          {inventoryItems.filter(item => item.quantity <= (item.minThreshold || 0)).length > 0 ? (
            <ul className="low-stock-list">
              {inventoryItems
                .filter(item => item.quantity <= (item.minThreshold || 0))
                .map(item => (
                  <li key={item.inventoryId} className="low-stock-item">
                    <span className="stock-item-name">{item.itemName}</span>
                    <span className="stock-quantity">
                      {item.quantity} {item.unit} (Min: {item.minThreshold || 0})
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="no-data">All items are well stocked</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Reports
