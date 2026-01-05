import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

export default function App() {
  const location = useLocation();

  return (
    <div className="app-root">
      <header className="app-header">
        <nav className="navbar">
          <div className="navbar-left">
            <Link to="/" className="brand">
              FilmyCosmo
            </Link>
          </div>
          <div className="navbar-center">
            <Link to="/" className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}>
              Home
            </Link>
            <Link
              to="/moviegrip"
              className={location.pathname.startsWith('/moviegrip') ? 'nav-link active' : 'nav-link'}
            >
              Movies
            </Link>
          </div>
          <div className="navbar-right">
            <Link
              to="/admin"
              className={location.pathname.startsWith('/admin') ? 'nav-link active' : 'nav-link'}
            >
              Admin
            </Link>
          </div>
        </nav>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <footer className="app-footer">
        &copy; {new Date().getFullYear()} FilmyCosmo. All rights reserved.
      </footer>
    </div>
  );
}


