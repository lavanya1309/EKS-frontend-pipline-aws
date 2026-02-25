import { useState, useEffect } from 'react'
import api from '../services/api'
import './Tables.css'

function Tables() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingTable, setEditingTable] = useState(null)
  const [formData, setFormData] = useState({
    restaurantId: 'restaurant-1',
    tableNumber: '',
    capacity: '',
    location: 'indoor'
  })
  const [error, setError] = useState('')

  useEffect(() => {
    loadTables()
  }, [])

  const loadTables = async () => {
    try {
      setLoading(true)
      const response = await api.getTables('restaurant-1')
      if (response.success) {
        setTables(response.data || [])
      }
    } catch (err) {
      setError(err.message || 'Failed to load tables')
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
        capacity: parseInt(formData.capacity)
      }

      if (editingTable) {
        await api.updateTable(editingTable.tableId, data)
      } else {
        await api.createTable(data)
      }

      setShowForm(false)
      setEditingTable(null)
      resetForm()
      loadTables()
    } catch (err) {
      setError(err.message || 'Failed to save table')
    }
  }

  const handleEdit = (table) => {
    setEditingTable(table)
    setFormData({
      restaurantId: table.restaurantId,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
      location: table.location
    })
    setShowForm(true)
  }

  const handleDelete = async (tableId) => {
    if (!window.confirm('Are you sure you want to delete this table?')) return

    try {
      await api.deleteTable(tableId)
      loadTables()
    } catch (err) {
      setError(err.message || 'Failed to delete table')
    }
  }

  const handleStatusChange = async (tableId, newStatus) => {
    try {
      await api.updateTable(tableId, { status: newStatus })
      loadTables()
    } catch (err) {
      setError(err.message || 'Failed to update table status')
    }
  }

  const resetForm = () => {
    setFormData({
      restaurantId: 'restaurant-1',
      tableNumber: '',
      capacity: '',
      location: 'indoor'
    })
    setEditingTable(null)
  }

  const getStatusColor = (status) => {
    const colors = {
      available: '#10b981',
      occupied: '#ef4444',
      reserved: '#f59e0b',
      cleaning: '#3b82f6'
    }
    return colors[status] || '#6b7280'
  }

  return (
    <div className="tables">
      <div className="tables-header">
        <h1>🪑 Tables</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true) }}>
          + Add Table
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="form-modal">
          <div className="form-content">
            <h2>{editingTable ? 'Edit Table' : 'Add New Table'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Table Number *</label>
                  <input
                    type="text"
                    value={formData.tableNumber}
                    onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Location</label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                >
                  <option value="indoor">Indoor</option>
                  <option value="outdoor">Outdoor</option>
                  <option value="terrace">Terrace</option>
                  <option value="private">Private Room</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingTable ? 'Update' : 'Create'}
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
        <div className="loading">Loading tables...</div>
      ) : (
        <div className="tables-grid">
          {tables.length === 0 ? (
            <div className="empty-state">No tables found. Add your first table!</div>
          ) : (
            tables.map(table => (
              <div key={table.tableId} className="table-card">
                <div className="table-header">
                  <h3>Table {table.tableNumber}</h3>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(table.status) }}
                  >
                    {table.status}
                  </span>
                </div>
                <div className="table-info">
                  <div className="info-item">
                    <span className="info-label">Capacity:</span>
                    <span className="info-value">{table.capacity} seats</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Location:</span>
                    <span className="info-value">{table.location}</span>
                  </div>
                </div>
                <div className="table-actions">
                  <select
                    value={table.status}
                    onChange={(e) => handleStatusChange(table.tableId, e.target.value)}
                    className="status-select"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                    <option value="cleaning">Cleaning</option>
                  </select>
                  <button onClick={() => handleEdit(table)} className="btn-edit">Edit</button>
                  <button onClick={() => handleDelete(table.tableId)} className="btn-delete">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Tables

