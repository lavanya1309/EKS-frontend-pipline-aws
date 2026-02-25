const API_BASE_URL = '/api'

const api = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    const token = localStorage.getItem('token')
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      },
      ...options
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body)
    }

    try {
      const response = await fetch(url, config)
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('API Error:', error)
      // If it's a network error, provide a helpful message
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Unable to connect to server. Please check if the backend server is running.')
      }
      throw error
    }
  },

  // Authentication methods
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    // Store token in localStorage
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response
  },

  async signup(name, email, password, phone, role) {
    const response = await this.request('/auth/signup', {
      method: 'POST',
      body: { name, email, password, phone, role }
    })
    // Store token in localStorage
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
    }
    return response
  },

  async getProfile() {
    return this.request('/auth/profile')
  },

  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: profileData
    })
  },

  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  getToken() {
    return localStorage.getItem('token')
  },

  getUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  },

  isAuthenticated() {
    return !!this.getToken()
  },

  // Menu Management
  async getMenuItems(restaurantId) {
    return this.request(`/menu/restaurant/${restaurantId}`)
  },

  async getMenuItem(itemId) {
    return this.request(`/menu/${itemId}`)
  },

  async createMenuItem(itemData) {
    return this.request('/menu', {
      method: 'POST',
      body: itemData
    })
  },

  async updateMenuItem(itemId, itemData) {
    return this.request(`/menu/${itemId}`, {
      method: 'PUT',
      body: itemData
    })
  },

  async deleteMenuItem(itemId) {
    return this.request(`/menu/${itemId}`, {
      method: 'DELETE'
    })
  },

  // Orders
  async getOrders(restaurantId, status) {
    const url = status 
      ? `/orders/restaurant/${restaurantId}?status=${status}`
      : `/orders/restaurant/${restaurantId}`
    return this.request(url)
  },

  async getOrder(orderId) {
    return this.request(`/orders/${orderId}`)
  },

  async createOrder(orderData) {
    return this.request('/orders', {
      method: 'POST',
      body: orderData
    })
  },

  async updateOrder(orderId, orderData) {
    return this.request(`/orders/${orderId}`, {
      method: 'PUT',
      body: orderData
    })
  },

  async deleteOrder(orderId) {
    return this.request(`/orders/${orderId}`, {
      method: 'DELETE'
    })
  },

  // Tables
  async getTables(restaurantId) {
    return this.request(`/tables/restaurant/${restaurantId}`)
  },

  async getTable(tableId) {
    return this.request(`/tables/${tableId}`)
  },

  async createTable(tableData) {
    return this.request('/tables', {
      method: 'POST',
      body: tableData
    })
  },

  async updateTable(tableId, tableData) {
    return this.request(`/tables/${tableId}`, {
      method: 'PUT',
      body: tableData
    })
  },

  async deleteTable(tableId) {
    return this.request(`/tables/${tableId}`, {
      method: 'DELETE'
    })
  },

  // Reservations
  async getReservations(restaurantId, date) {
    const url = date
      ? `/reservations/restaurant/${restaurantId}?date=${date}`
      : `/reservations/restaurant/${restaurantId}`
    return this.request(url)
  },

  async getReservation(reservationId) {
    return this.request(`/reservations/${reservationId}`)
  },

  async createReservation(reservationData) {
    return this.request('/reservations', {
      method: 'POST',
      body: reservationData
    })
  },

  async updateReservation(reservationId, reservationData) {
    return this.request(`/reservations/${reservationId}`, {
      method: 'PUT',
      body: reservationData
    })
  },

  async deleteReservation(reservationId) {
    return this.request(`/reservations/${reservationId}`, {
      method: 'DELETE'
    })
  },

  // Inventory Management
  async getInventoryItems(restaurantId) {
    return this.request(`/inventory/restaurant/${restaurantId}`)
  },

  async getInventoryItem(inventoryId) {
    return this.request(`/inventory/${inventoryId}`)
  },

  async createInventoryItem(itemData) {
    return this.request('/inventory', {
      method: 'POST',
      body: itemData
    })
  },

  async updateInventoryItem(inventoryId, itemData) {
    return this.request(`/inventory/${inventoryId}`, {
      method: 'PUT',
      body: itemData
    })
  },

  async deleteInventoryItem(inventoryId) {
    return this.request(`/inventory/${inventoryId}`, {
      method: 'DELETE'
    })
  },

  // Staff Management
  async getStaffMembers(restaurantId) {
    return this.request(`/staff/restaurant/${restaurantId}`)
  },

  async getStaffMember(staffId) {
    return this.request(`/staff/${staffId}`)
  },

  async createStaffMember(staffData) {
    return this.request('/staff', {
      method: 'POST',
      body: staffData
    })
  },

  async updateStaffMember(staffId, staffData) {
    return this.request(`/staff/${staffId}`, {
      method: 'PUT',
      body: staffData
    })
  },

  async deleteStaffMember(staffId) {
    return this.request(`/staff/${staffId}`, {
      method: 'DELETE'
    })
  },

  // Reports & Analytics
  async getReports(restaurantId) {
    return this.request(`/reports/restaurant/${restaurantId}`)
  }
}

export default api

