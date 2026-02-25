import './Dashboard.css'

function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Restaurant Management Dashboard</h1>
        <p>Welcome to your restaurant management system</p>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h2>Menu Management</h2>
            <p>Manage your restaurant menu items</p>
          </div>
          
          <div className="dashboard-card">
            <h2>Orders</h2>
            <p>View and manage orders</p>
          </div>
          
          <div className="dashboard-card">
            <h2>Tables</h2>
            <p>Manage restaurant tables</p>
          </div>
          
          <div className="dashboard-card">
            <h2>Reservations</h2>
            <p>Handle table reservations</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

