import { useState, useEffect } from 'react'
import api from '../services/api'
import './MenuManagement.css'

function MenuManagement() {
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    restaurantId: 'restaurant-1', // Default restaurant ID
    name: '',
    description: '',
    category: '',
    price: '',
    imageUrl: '',
    isAvailable: true,
    preparationTime: '',
    isVegetarian: false,
    isVegan: false
  })
  const [error, setError] = useState('')

  useEffect(() => {
    loadMenuItems()
  }, [])

  const loadMenuItems = async () => {
    try {
      setLoading(true)
      const response = await api.getMenuItems(formData.restaurantId)
      if (response.success) {
        setMenuItems(response.data || [])
      }
    } catch (err) {
      setError(err.message || 'Failed to load menu items')
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
        price: parseFloat(formData.price),
        preparationTime: formData.preparationTime ? parseInt(formData.preparationTime) : null
      }

      if (editingItem) {
        await api.updateMenuItem(editingItem.itemId, data)
      } else {
        await api.createMenuItem(data)
      }

      setShowForm(false)
      setEditingItem(null)
      resetForm()
      loadMenuItems()
    } catch (err) {
      setError(err.message || 'Failed to save menu item')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      restaurantId: item.restaurantId,
      name: item.name,
      description: item.description || '',
      category: item.category,
      price: item.price,
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
      preparationTime: item.preparationTime || '',
      isVegetarian: item.isVegetarian || false,
      isVegan: item.isVegan || false
    })
    setShowForm(true)
  }

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return

    try {
      await api.deleteMenuItem(itemId)
      loadMenuItems()
    } catch (err) {
      setError(err.message || 'Failed to delete menu item')
    }
  }

  const resetForm = () => {
    setFormData({
      restaurantId: 'restaurant-1',
      name: '',
      description: '',
      category: '',
      price: '',
      imageUrl: '',
      isAvailable: true,
      preparationTime: '',
      isVegetarian: false,
      isVegan: false
    })
    setEditingItem(null)
  }

  const categories = ['Appetizer', 'Main Course', 'Dessert', 'Beverage', 'Salad', 'Soup', 'Side Dish']

  return (
    <div className="menu-management">
      <div className="menu-header">
        <h1>🍽️ Menu Management</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true) }}>
          + Add Menu Item
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="form-modal">
          <div className="form-content">
            <h2>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Preparation Time (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.preparationTime}
                    onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    />
                    Available
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isVegetarian}
                      onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                    />
                    Vegetarian
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isVegan}
                      onChange={(e) => setFormData({ ...formData, isVegan: e.target.checked })}
                    />
                    Vegan
                  </label>
                </div>
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
        <div className="loading">Loading menu items...</div>
      ) : (
        <div className="menu-items-grid">
          {menuItems.length === 0 ? (
            <div className="empty-state">No menu items found. Add your first item!</div>
          ) : (
            menuItems.map(item => (
              <div key={item.itemId} className="menu-item-card">
                {item.imageUrl && (
                  <img src={item.imageUrl} alt={item.name} className="menu-item-image" />
                )}
                <div className="menu-item-info">
                  <div className="menu-item-header">
                    <h3>{item.name}</h3>
                    <span className={`status-badge ${item.isAvailable ? 'available' : 'unavailable'}`}>
                      {item.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <p className="menu-item-category">{item.category}</p>
                  {item.description && <p className="menu-item-description">{item.description}</p>}
                  <div className="menu-item-footer">
                    <span className="menu-item-price">₹{item.price}</span>
                    <div className="menu-item-actions">
                      <button onClick={() => handleEdit(item)} className="btn-edit">Edit</button>
                      <button onClick={() => handleDelete(item.itemId)} className="btn-delete">Delete</button>
                    </div>
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

export default MenuManagement

