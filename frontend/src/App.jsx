import React, { useState } from 'react';

import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const closeDrawer = () => setMobileOpen(false);

  return (
    <div className="app-root">
      <style>{`
        .app-container { display: flex; min-height: 100vh; background: #141414; color: #fff; font-family: sans-serif; }
        
        /* Sidebar Styles */
        .sidebar {
          width: 260px; background: #000; height: 100vh; position: fixed; left: 0; top: 0;
          display: flex; flex-direction: column; padding: 20px; z-index: 1000;
          transition: transform 0.3s ease; border-right: 1px solid #333;
        }
        .brand { font-size: 1.5rem; font-weight: bold; color: #e50914; margin-bottom: 40px; display: block; text-decoration: none; }
        .nav-item {
          padding: 12px 15px; color: #aaa; text-decoration: none; border-radius: 4px;
          margin-bottom: 8px; display: block; transition: 0.2s; cursor: pointer; border: none; background: none; text-align: left; font-size: 1rem; width: 100%;
        }
        .nav-item:hover, .nav-item.active { background: #e50914; color: white; }
        
        /* Main Content Styles */
        .main-content { flex: 1; margin-left: 260px; display: flex; flex-direction: column; min-height: 100vh; }
        .content-wrapper { padding: 30px; flex: 1; }
        
        /* Mobile Header */
        .mobile-header { display: none; background: #000; padding: 15px; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 900; border-bottom: 1px solid #333; }
        .hamburger { background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer; }
        .overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; }

        /* Responsive */
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .main-content { margin-left: 0; }
          .mobile-header { display: flex; }
          .content-wrapper { padding: 15px; }
        }
      `}</style>

      <div className="app-container">
        {/* Mobile Overlay */}
        {mobileOpen && <div className="overlay" onClick={closeDrawer} />}

        {/* Sidebar Navigation */}
        <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
          <Link to="/" className="brand" onClick={closeDrawer}>FilmyCosmo Admin</Link>
          
          <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`} onClick={closeDrawer}>
            Dashboard
          </Link>

          <div style={{ margin: '20px 0 10px 15px', color: '#666', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Filters</div>
          <Link to="/?tag=Bollywood" className="nav-item" onClick={closeDrawer}>
            Bollywood
          </Link>
          <Link to="/?tag=Hollywood" className="nav-item" onClick={closeDrawer}>
            Hollywood
          </Link>
          <Link to="/?tag=South" className="nav-item" onClick={closeDrawer}>
            South Movies
          </Link>
          <Link to="/?type=webseries" className="nav-item" onClick={closeDrawer}>
            Web Series
          </Link>
          
          {token ? (
            <button onClick={handleLogout} className="nav-item" style={{ marginTop: 'auto' }}>
              Logout
            </button>
          ) : (
            <Link to="/login" className="nav-item" onClick={closeDrawer}>Login</Link>
          )}
        </aside>

        {/* Main Content Area */}
        <div className="main-content">
          <header className="mobile-header">
            <span className="brand" style={{ margin: 0, fontSize: '1.2rem' }}>FilmyCosmo</span>
            <button className="hamburger" onClick={() => setMobileOpen(true)}>☰</button>
          </header>
          
          <div className="content-wrapper">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
