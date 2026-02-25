import './Navbar.css'

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-left">
          <img src="/whatsapp logo.png" alt="Logo" className="navbar-logo-image" />
          <h1 className="navbar-logo">Restaurant Management</h1>
        </div>
        <div className="navbar-right">
          <div className="navbar-user">
            <span className="navbar-user-name">Admin</span>
            <div className="navbar-user-avatar">A</div>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

