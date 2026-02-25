import { useState, useEffect } from 'react'
import api from '../services/api'
import './Staff.css'

function Staff() {
  const [staffMembers, setStaffMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [formData, setFormData] = useState({
    restaurantId: 'restaurant-1',
    email: '',
    name: '',
    role: '',
    phone: '',
    shift: '',
    salary: '',
    hireDate: '',
    status: 'active'
  })
  const [error, setError] = useState('')

  useEffect(() => {
    loadStaff()
  }, [])

  const loadStaff = async () => {
    try {
      setLoading(true)
      const response = await api.getStaffMembers('restaurant-1')
      if (response.success) {
        setStaffMembers(response.data || [])
      }
    } catch (err) {
      setError(err.message || 'Failed to load staff')
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
        salary: formData.salary ? parseFloat(formData.salary) : null
      }

      if (editingMember) {
        await api.updateStaffMember(editingMember.staffId, data)
      } else {
        await api.createStaffMember(data)
      }

      setShowForm(false)
      setEditingMember(null)
      resetForm()
      loadStaff()
    } catch (err) {
      setError(err.message || 'Failed to save staff member')
    }
  }

  const handleEdit = (member) => {
    setEditingMember(member)
    setFormData({
      restaurantId: member.restaurantId,
      email: member.email,
      name: member.name,
      role: member.role,
      phone: member.phone || '',
      shift: member.shift || '',
      salary: member.salary || '',
      hireDate: member.hireDate || '',
      status: member.status || 'active'
    })
    setShowForm(true)
  }

  const handleDelete = async (staffId) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return

    try {
      await api.deleteStaffMember(staffId)
      loadStaff()
    } catch (err) {
      setError(err.message || 'Failed to delete staff member')
    }
  }

  const resetForm = () => {
    setFormData({
      restaurantId: 'restaurant-1',
      email: '',
      name: '',
      role: '',
      phone: '',
      shift: '',
      salary: '',
      hireDate: '',
      status: 'active'
    })
    setEditingMember(null)
  }

  const getStatusColor = (status) => {
    const colors = {
      active: '#10b981',
      inactive: '#6b7280',
      'on-leave': '#f59e0b'
    }
    return colors[status] || '#6b7280'
  }

  const roles = ['waiter', 'chef', 'cashier', 'manager', 'host']
  const shifts = ['morning', 'afternoon', 'evening', 'night']

  return (
    <div className="staff">
      <div className="staff-header">
        <h1>👥 Staff Management</h1>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true) }}>
          + Add Staff Member
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="form-modal">
          <div className="form-content">
            <h2>{editingMember ? 'Edit Staff Member' : 'Add New Staff Member'}</h2>
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
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    required
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                      <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Shift</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                  >
                    <option value="">Select Shift</option>
                    {shifts.map(shift => (
                      <option key={shift} value={shift}>{shift.charAt(0).toUpperCase() + shift.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Salary (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hire Date</label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    required
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on-leave">On Leave</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingMember ? 'Update' : 'Create'}
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
        <div className="loading">Loading staff...</div>
      ) : (
        <div className="staff-grid">
          {staffMembers.length === 0 ? (
            <div className="empty-state">No staff members found. Add your first staff member!</div>
          ) : (
            staffMembers.map(member => (
              <div key={member.staffId} className="staff-card">
                <div className="staff-header-card">
                  <h3>{member.name}</h3>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(member.status) }}
                  >
                    {member.status}
                  </span>
                </div>
                <div className="staff-info">
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{member.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Role:</span>
                    <span className="info-value">{member.role}</span>
                  </div>
                  {member.phone && (
                    <div className="info-item">
                      <span className="info-label">Phone:</span>
                      <span className="info-value">{member.phone}</span>
                    </div>
                  )}
                  {member.shift && (
                    <div className="info-item">
                      <span className="info-label">Shift:</span>
                      <span className="info-value">{member.shift}</span>
                    </div>
                  )}
                  {member.salary && (
                    <div className="info-item">
                      <span className="info-label">Salary:</span>
                      <span className="info-value">₹{member.salary.toLocaleString()}/month</span>
                    </div>
                  )}
                  {member.hireDate && (
                    <div className="info-item">
                      <span className="info-label">Hire Date:</span>
                      <span className="info-value">{new Date(member.hireDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <div className="staff-actions">
                  <button onClick={() => handleEdit(member)} className="btn-edit">Edit</button>
                  <button onClick={() => handleDelete(member.staffId)} className="btn-delete">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Staff
