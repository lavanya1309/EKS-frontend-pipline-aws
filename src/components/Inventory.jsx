import { useState, useEffect } from 'react'
import api from '../services/api'
import './Inventory.css'

function Inventory() {
  const [inventoryItems, setInventoryItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    restaurantId: 'restaurant-1',
    itemName: '',
    category: '',
    quantity: '',
    unit: 'pieces',
    minThreshold: '',
    maxThreshold: '',
    supplier: '',
    costPerUnit: '',
    expiryDate: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    try {
      setLoading(true)
      const response = await api.getInventoryItems('restaurant-1')
      if (response.success) {
        setInventoryItems(response.data || [])
      }
    } catch (err) {
      setError(err.message || 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const data = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        minThreshold: formData.minThreshold ? parseFloat(formData.minThreshold) : 0,
        maxThreshold: formData.maxThreshold ? parseFloat(formData.maxThreshold) : null,
        costPerUnit: formData.costPerUnit ? parseFloat(formData.costPerUnit) : null
      }

      if (editingItem) {
        await api.updateInventoryItem(editingItem.inventoryId, data)
      } else {
        await api.createInventoryItem(data)
      }

      setShowForm(false)
      setEditingItem(null)
      resetForm()
      loadInventory()
    } catch (err) {
      setError(err.message || 'Failed to save inventory item')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      restaurantId: item.restaurantId,
      itemName: item.itemName,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit || 'pieces',
      minThreshold: item.minThreshold || '',
      maxThreshold: item.maxThreshold || '',
      supplier: item.supplier || '',
      costPerUnit: item.costPerUnit || '',
      expiryDate: item.expiryDate || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (inventoryId) => {
    if (!window.confirm('Are you sure you want to delete this inventory item?')) return

    try {
      await api.deleteInventoryItem(inventoryId)
      loadInventory()
    } catch (err) {
      setError(err.message || 'Failed to delete inventory item')
    }
  }

  const resetForm = () => {
    setFormData({
      restaurantId: 'restaurant-1',
      itemName: '',
      category: '',
      quantity: '',
      unit: 'pieces',
      minThreshold: '',
      maxThreshold: '',
      supplier: '',
      costPerUnit: '',
      expiryDate: ''
    })
    setEditingItem(null)
  }

  const getStockStatus = (quantity, minThreshold) => {
    if (quantity <= 0) return { status: 'out', color: '#ef4444', text: 'Out of Stock' }
    if (quantity <= minThreshold) return { status: 'low', color: '#f59e0b', text: 'Low Stock' }
    return { status: 'good', color: '#10b981', text: 'In Stock' }
  }

  const categories = ['vegetables', 'meat', 'dairy', 'beverages', 'spices', 'grains', 'fruits', 'other']
  const units = ['pieces', 'kg', 'liters', 'boxes', 'packets', 'bottles']

  return (
    <div className="inventory">
      <div className="inventory-header">
        <h1>📦 Inventory Management</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true) }}>
          + Add Inventory Item
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="form-modal">
          <div className="form-content">
            <h2>{editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Minimum Threshold</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.minThreshold}
                    onChange={(e) => setFormData({ ...formData, minThreshold: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Maximum Threshold</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.maxThreshold}
                    onChange={(e) => setFormData({ ...formData, maxThreshold: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Cost Per Unit</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingItem ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); resetForm() }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading inventory...</div>
      ) : (
        <div className="inventory-grid">
          {inventoryItems.length === 0 ? (
            <div className="empty-state">No inventory items found. Add your first item!</div>
          ) : (
            inventoryItems.map(item => {
              const stockStatus = getStockStatus(item.quantity, item.minThreshold || 0)
              return (
                <div key={item.inventoryId} className="inventory-card">
                  <div className="inventory-header-card">
                    <h3>{item.itemName}</h3>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: stockStatus.color }}
                    >
                      {stockStatus.text}
                    </span>
                  </div>
                  <div className="inventory-info">
                    <div className="info-item">
                      <span className="info-label">Category:</span>
                      <span className="info-value">{item.category}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Quantity:</span>
                      <span className="info-value">{item.quantity} {item.unit}</span>
                    </div>
                    {item.minThreshold !== undefined && (
                      <div className="info-item">
                        <span className="info-label">Min Threshold:</span>
                        <span className="info-value">{item.minThreshold} {item.unit}</span>
                      </div>
                    )}
                    {item.supplier && (
                      <div className="info-item">
                        <span className="info-label">Supplier:</span>
                        <span className="info-value">{item.supplier}</span>
                      </div>
                    )}
                    {item.costPerUnit && (
                      <div className="info-item">
                        <span className="info-label">Cost:</span>
                        <span className="info-value">₹{item.costPerUnit} per {item.unit}</span>
                      </div>
                    )}
                    {item.expiryDate && (
                      <div className="info-item">
                        <span className="info-label">Expiry:</span>
                        <span className="info-value">{new Date(item.expiryDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="inventory-actions">
                    <button onClick={() => handleEdit(item)} className="btn-edit">Edit</button>
                    <button onClick={() => handleDelete(item.inventoryId)} className="btn-delete">Delete</button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default Inventory
