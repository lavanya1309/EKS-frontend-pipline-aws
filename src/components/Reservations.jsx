import { useState, useEffect } from 'react'
import api from '../services/api'
import './Reservations.css'

function Reservations() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingReservation, setEditingReservation] = useState(null)
  const [formData, setFormData] = useState({
    restaurantId: 'restaurant-1',
    tableId: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    reservationDate: '',
    reservationTime: '',
    numberOfGuests: '',
    specialRequests: ''
  })
  const [tables, setTables] = useState([])
  const [error, setError] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    loadReservations()
    loadTables()
  }, [dateFilter])

  const loadReservations = async () => {
    try {
      setLoading(true)
      const response = await api.getReservations('restaurant-1', dateFilter || null)
      if (response.success) {
        setReservations(response.data || [])
      }
    } catch (err) {
      setError(err.message || 'Failed to load reservations')
    } finally {
      setLoading(false)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let reservationDate = formData.reservationDate
      if (reservationDate.includes('T')) {
        reservationDate = reservationDate.split('T')[0]
      }

      const data = {
        restaurantId: formData.restaurantId,
        tableId: formData.tableId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || undefined,
        reservationDate: reservationDate,
        reservationTime: formData.reservationTime,
        numberOfGuests: parseInt(formData.numberOfGuests),
        specialRequests: formData.specialRequests || undefined
      }

      if (editingReservation) {
        await api.updateReservation(editingReservation.reservationId, data)
      } else {
        await api.createReservation(data)
      }

      setShowForm(false)
      setEditingReservation(null)
      resetForm()
      loadReservations()
    } catch (err) {
      setError(err.message || 'Failed to save reservation')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (reservation) => {
    setEditingReservation(reservation)
    setFormData({
      restaurantId: reservation.restaurantId,
      tableId: reservation.tableId,
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone,
      customerEmail: reservation.customerEmail || '',
      reservationDate: reservation.reservationDate,
      reservationTime: reservation.reservationTime,
      numberOfGuests: reservation.numberOfGuests,
      specialRequests: reservation.specialRequests || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (reservationId) => {
    try {
      await api.deleteReservation(reservationId)
      loadReservations()
    } catch (err) {
      setError(err.message || 'Failed to delete reservation')
    }
  }

  const handleStatusChange = async (reservationId, newStatus) => {
    try {
      await api.updateReservation(reservationId, { status: newStatus })
      loadReservations()
    } catch (err) {
      setError(err.message || 'Failed to update reservation status')
    }
  }

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0]
    setFormData({
      restaurantId: 'restaurant-1',
      tableId: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      reservationDate: today,
      reservationTime: '',
      numberOfGuests: '',
      specialRequests: ''
    })
    setEditingReservation(null)
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#10b981',
      seated: '#3b82f6',
      completed: '#6b7280',
      cancelled: '#ef4444',
      no_show: '#9ca3af'
    }
    return colors[status] || '#6b7280'
  }

  return (
    <div className="reservations">
      <div className="reservations-header">
        <h1>📅 Reservations</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true) }}>
          + New Reservation
        </button>
      </div>

      <div className="filter-section">
        <label>Filter by Date:</label>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        {dateFilter && (
          <button
            className="btn-clear-filter"
            onClick={() => setDateFilter('')}
          >
            Clear Filter
          </button>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="form-modal">
          <div className="form-content">
            <h2>{editingReservation ? 'Edit Reservation' : 'New Reservation'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Table *</label>
                  <select
                    value={formData.tableId}
                    onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
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
                  <label>Number of Guests *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.numberOfGuests}
                    onChange={(e) => setFormData({ ...formData, numberOfGuests: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Customer Phone *</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Customer Email</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Reservation Date *</label>
                  <input
                    type="date"
                    value={formData.reservationDate}
                    onChange={(e) => setFormData({ ...formData, reservationDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Reservation Time *</label>
                  <input
                    type="time"
                    value={formData.reservationTime}
                    onChange={(e) => setFormData({ ...formData, reservationTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Special Requests</label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  rows="3"
                  placeholder="Any special requests or notes..."
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingReservation ? 'Update' : 'Create'}
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
        <div className="loading">Loading reservations...</div>
      ) : (
        <div className="reservations-list">
          {reservations.length === 0 ? (
            <div className="empty-state">No reservations found.</div>
          ) : (
            reservations.map(reservation => (
              <div key={reservation.reservationId} className="reservation-card">
                <div className="reservation-header">
                  <div>
                    <h3>{reservation.customerName}</h3>
                    <p className="reservation-meta">
                      {reservation.reservationDate} at {reservation.reservationTime} • {reservation.numberOfGuests} guests
                    </p>
                  </div>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(reservation.status) }}
                  >
                    {reservation.status}
                  </span>
                </div>
                <div className="reservation-info">
                  <div className="info-item">
                    <span className="info-label">Phone:</span>
                    <span className="info-value">{reservation.customerPhone}</span>
                  </div>
                  {reservation.customerEmail && (
                    <div className="info-item">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{reservation.customerEmail}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="info-label">Table:</span>
                    <span className="info-value">Table {reservation.tableId}</span>
                  </div>
                  {reservation.specialRequests && (
                    <div className="info-item">
                      <span className="info-label">Special Requests:</span>
                      <span className="info-value">{reservation.specialRequests}</span>
                    </div>
                  )}
                </div>
                <div className="reservation-actions">
                  <select
                    value={reservation.status}
                    onChange={(e) => handleStatusChange(reservation.reservationId, e.target.value)}
                    className="status-select"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="seated">Seated</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="no_show">No Show</option>
                  </select>
                  <button onClick={() => handleEdit(reservation)} className="btn-edit">Edit</button>
                  <button onClick={() => handleDelete(reservation.reservationId)} className="btn-delete">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Reservations

