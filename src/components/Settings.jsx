import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import './Settings.css'

function Settings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [user, setUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await api.getProfile()
      if (response.success) {
        const userData = response.data
        setUser(userData)
        setFormData({
          name: userData.name || '',
          phone: userData.phone || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to load profile')
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      setLoading(true)
      const updates = {}
      if (formData.name !== user.name) updates.name = formData.name
      if (formData.phone !== user.phone) updates.phone = formData.phone

      if (Object.keys(updates).length === 0) {
        setError('No changes to save')
        return
      }

      const response = await api.updateProfile(updates)
      if (response.success) {
        setSuccess('Profile updated successfully')
        setUser(response.data)
        localStorage.setItem('user', JSON.stringify(response.data))
        loadProfile()
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (formData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    try {
      setLoading(true)
      const response = await api.updateProfile({
        password: formData.newPassword
      })
      if (response.success) {
        setSuccess('Password updated successfully')
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      }
    } catch (err) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      api.logout()
      navigate('/login')
    }
  }

  return (
    <div className="settings">
      <div className="settings-header">
        <h1>⚙️ Settings</h1>
        <p className="settings-subtitle">Manage your account information and security</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="settings-section">
        <div className="section-header">
          <h2>👤 Profile Information</h2>
          <p className="section-description">Update your username and contact details</p>
        </div>
        <form onSubmit={handleProfileUpdate} className="settings-form">
          <div className="form-group">
            <label htmlFor="username">Username *</label>
            <input
              id="username"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your username"
              required
            />
            <small>This is your display name</small>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="disabled-input"
            />
            <small>Email cannot be changed</small>
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>

      <div className="settings-section">
        <div className="section-header">
          <h2>🔒 Change Password</h2>
          <p className="section-description">Update your password to keep your account secure</p>
        </div>
        <form onSubmit={handlePasswordUpdate} className="settings-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password *</label>
            <input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              placeholder="Enter new password"
              minLength="8"
              required
            />
            <small>Must be at least 8 characters with uppercase, lowercase, and number</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password *</label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm new password"
              minLength="8"
              required
            />
            {formData.newPassword && formData.confirmPassword && (
              <small className={formData.newPassword === formData.confirmPassword ? 'text-success' : 'text-error'}>
                {formData.newPassword === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </small>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading || !formData.newPassword || !formData.confirmPassword}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      <div className="settings-section">
        <div className="section-header">
          <h2>🚪 Account Actions</h2>
          <p className="section-description">Manage your account session</p>
        </div>
        <div className="logout-section">
          <div className="logout-info">
            <p>Sign out from your account. You will need to login again to access the dashboard.</p>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings

