import React, { useState } from 'react';
import './App.css';

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
      <div className="app-container">
        {/* Mobile Overlay */}
        {mobileOpen && <div className="overlay" onClick={closeDrawer} />}

        {/* Sidebar Navigation */}
        <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
          <Link to="/" className="brand" onClick={closeDrawer}>FilmyCosmo Admin</Link>

          <Link to="/" className={`nav-item ${location.pathname === '/' && !location.search ? 'active' : ''}`} onClick={closeDrawer}>
            Dashboard
          </Link>

          <div className="nav-group-label">Filters</div>
          <Link to="/?tag=Bollywood" className={`nav-item ${location.search.includes('tag=Bollywood') ? 'active' : ''}`} onClick={closeDrawer}>
            Bollywood
          </Link>
          <Link to="/?tag=Hollywood" className={`nav-item ${location.search.includes('tag=Hollywood') ? 'active' : ''}`} onClick={closeDrawer}>
            Hollywood
          </Link>
          <Link to="/?tag=South" className={`nav-item ${location.search.includes('tag=South') ? 'active' : ''}`} onClick={closeDrawer}>
            South Movies
          </Link>
          <Link to="/?type=webseries" className={`nav-item ${location.search.includes('type=webseries') ? 'active' : ''}`} onClick={closeDrawer}>
            Web Series
          </Link>
          <Link to="/?movieshow=false" className={`nav-item ${location.search.includes('movieshow=false') ? 'active' : ''}`} onClick={closeDrawer}>
            Hidden Movies
          </Link>
          <Link to="/?trending=true" className={`nav-item ${location.search.includes('trending=true') ? 'active' : ''}`} onClick={closeDrawer}>
            Trending Movies
          </Link>

          {token ? (
            <button onClick={handleLogout} className="nav-item">
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
