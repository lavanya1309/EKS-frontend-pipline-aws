import { useState, useEffect } from 'react'
import api from '../services/api'
import './Orders.css'

function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    restaurantId: 'restaurant-1',
    tableId: '',
    tableNumber: '',
    orderType: 'dine-in',
    items: [],
    notes: ''
  })
  const [selectedItems, setSelectedItems] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [tables, setTables] = useState([])
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadOrders()
    loadMenuItems()
    loadTables()
  }, [statusFilter])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await api.getOrders('restaurant-1', statusFilter !== 'all' ? statusFilter : null)
      if (response.success) {
        setOrders(response.data || [])
      }
    } catch (err) {
      setError(err.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  const loadMenuItems = async () => {
    try {
      const response = await api.getMenuItems('restaurant-1')
      if (response.success) {
        setMenuItems(response.data || [])
      }
    } catch (err) {
      console.error('Failed to load menu items:', err)
    }
  }

  const loadTables = async () => {
    try {
      const response = await api.getTables('restaurant-1')
      if (response.success) {
        setTables(response.data || [])
      }
    } catch (err) {
      console.error('Failed to load tables:', err)
    }
  }

  const handleAddItem = (item) => {
    const existingItem = selectedItems.find(i => i.itemId === item.itemId)
    if (existingItem) {
      setSelectedItems(selectedItems.map(i =>
        i.itemId === item.itemId
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ))
    } else {
      setSelectedItems([...selectedItems, {
        itemId: item.itemId,
        name: item.name,
        price: item.price,
        quantity: 1
      }])
    }
  }

  const handleRemoveItem = (itemId) => {
    setSelectedItems(selectedItems.filter(i => i.itemId !== itemId))
  }

  const handleUpdateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      handleRemoveItem(itemId)
    } else {
      setSelectedItems(selectedItems.map(i =>
        i.itemId === itemId ? { ...i, quantity } : i
      ))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (selectedItems.length === 0) {
      setError('Please add at least one item to the order')
      return
    }

    try {
      const orderData = {
        ...formData,
        items: selectedItems
      }

      await api.createOrder(orderData)
      setShowForm(false)
      resetForm()
      loadOrders()
    } catch (err) {
      setError(err.message || 'Failed to create order')
    }
  }

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.updateOrder(orderId, { status: newStatus })
      loadOrders()
    } catch (err) {
      setError(err.message || 'Failed to update order status')
    }
  }

  const resetForm = () => {
    setFormData({
      restaurantId: 'restaurant-1',
      tableId: '',
      tableNumber: '',
      orderType: 'dine-in',
      items: [],
      notes: ''
    })
    setSelectedItems([])
  }

  const getTotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      preparing: '#3b82f6',
      ready: '#10b981',
      completed: '#6b7280',
      cancelled: '#ef4444'
    }
    return colors[status] || '#6b7280'
  }

  return (
    <div className="orders">
      <div className="orders-header">
        <h1>📋 Orders</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true) }}>
          + New Order
        </button>
      </div>

      <div className="filter-section">
        <label>Filter by Status:</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Orders</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="ready">Ready</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="form-modal">
          <div className="form-content">
            <h2>Create New Order</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Table *</label>
                  <select
                    value={formData.tableId}
                    onChange={(e) => {
                      const table = tables.find(t => t.tableId === e.target.value)
                      setFormData({
                        ...formData,
                        tableId: e.target.value,
                        tableNumber: table ? table.tableNumber : ''
                      })
                    }}
                    required
                  >
                    <option value="">Select Table</option>
                    {tables.map(table => (
                      <option key={table.tableId} value={table.tableId}>
                        Table {table.tableNumber} ({table.capacity} seats)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Order Type</label>
                  <select
                    value={formData.orderType}
                    onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
                  >
                    <option value="dine-in">Dine-in</option>
                    <option value="takeaway">Takeaway</option>
                    <option value="delivery">Delivery</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Add Menu Items</label>
                <div className="menu-items-selector">
                  {menuItems.filter(item => item.isAvailable).map(item => (
                    <button
                      key={item.itemId}
                      type="button"
                      className="menu-item-button"
                      onClick={() => handleAddItem(item)}
                    >
                      {item.name} - ₹{item.price}
                    </button>
                  ))}
                </div>
              </div>

              {selectedItems.length > 0 && (
                <div className="selected-items">
                  <h3>Selected Items</h3>
                  {selectedItems.map(item => (
                    <div key={item.itemId} className="selected-item">
                      <span>{item.name} × {item.quantity} = ₹{item.price * item.quantity}</span>
                      <div className="quantity-controls">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.itemId, item.quantity - 1)}
                        >-</button>
                        <span>{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.itemId, item.quantity + 1)}
                        >+</button>
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => handleRemoveItem(item.itemId)}
                        >Remove</button>
                      </div>
                    </div>
                  ))}
                  <div className="order-total">
                    <strong>Total: ₹{getTotal()}</strong>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">Create Order</button>
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); resetForm() }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : (
        <div className="orders-list">
          {orders.length === 0 ? (
            <div className="empty-state">No orders found.</div>
          ) : (
            orders.map(order => (
              <div key={order.orderId} className="order-card">
                <div className="order-header">
                  <div>
                    <h3>Order #{order.orderId.slice(0, 8)}</h3>
                    <p className="order-meta">
                      Table {order.tableNumber || 'N/A'} • {new Date(order.orderTime).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    {order.status}
                  </span>
                </div>
                <div className="order-items">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="order-item">
                      <span>{item.name} × {item.quantity}</span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="order-footer">
                  <div className="order-total">
                    <strong>Total: ₹{order.total}</strong>
                  </div>
                  <div className="order-actions">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleStatusUpdate(order.orderId, 'preparing')}
                        className="btn-status"
                      >
                        Start Preparing
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => handleStatusUpdate(order.orderId, 'ready')}
                        className="btn-status"
                      >
                        Mark Ready
                      </button>
                    )}
                    {order.status === 'ready' && (
                      <button
                        onClick={() => handleStatusUpdate(order.orderId, 'completed')}
                        className="btn-status"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Orders

