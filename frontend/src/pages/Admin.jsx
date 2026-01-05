import React, { useEffect, useState } from 'react';
import axios from 'axios';
import UploadForm from '../components/UploadForm';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [movies, setMovies] = useState([]);
  const [homeConfig, setHomeConfig] = useState(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingMovie, setEditingMovie] = useState(null);

  useEffect(() => {
    fetchMovies();
    fetchConfig();
  }, []);

  const fetchMovies = async () => {
    try {
      const res = await axios.get(`${API}/movies`);
      setMovies(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API}/home-config`);
      setHomeConfig(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = (token, user) => {
    localStorage.setItem('token', token);
    setToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
  };

  const handleUploaded = (newMovie) => {
    const movie = newMovie.movie || newMovie;
    setMovies((prev) => [movie, ...prev]);
  };

  const handleDelete = async (id) => {
    if (!token) return alert('Not authorized');
    if (!window.confirm('Delete movie?')) return;
    try {
      await axios.delete(`${API}/movies/${id}`, {
        headers: { 'x-auth-token': token },
      });
      setMovies((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      console.error(err);
      const message =
        (err.response && err.response.data && err.response.data.msg) ||
        'Delete failed. Please check that you are logged in as admin.';
      alert(message);
    }
  };

  const handleConfigChange = (field, value) => {
    setHomeConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveConfig = async () => {
  const startEditMovie = (movie) => {
    setEditingMovie({
      _id: movie._id,
      title: movie.title || '',
      description: movie.description || '',
      year: movie.year || '',
      tags: (movie.tags || []).join(', '),
      isActive: movie.isActive !== false,
    });
  };

  const handleEditFieldChange = (field, value) => {
    setEditingMovie((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveMovie = async () => {
    if (!editingMovie) return;
    if (!token) {
      alert('Please login as admin to update movies');
      return;
    }
    const { _id, title, description, year, tags, isActive } = editingMovie;
    try {
      const payload = {
        title,
        description,
        year,
        tags,
        isActive: !!isActive,
      };
      const res = await axios.put(`${API}/movies/${_id}`, payload, {
        headers: { 'x-auth-token': token },
      });
      const updatedMovie = res.data.movie;
      setMovies((prev) => prev.map((m) => (m._id === updatedMovie._id ? updatedMovie : m)));
      setEditingMovie(null);
      alert('Movie updated');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Failed to update movie');
    }
  };

  const toggleMovieActive = async (movie) => {
    if (!token) {
      alert('Please login as admin to change movie visibility');
      return;
    }
    try {
      const res = await axios.put(
        `${API}/movies/${movie._id}`,
        { isActive: !movie.isActive },
        { headers: { 'x-auth-token': token } }
      );
      const updatedMovie = res.data.movie;
      setMovies((prev) => prev.map((m) => (m._id === updatedMovie._id ? updatedMovie : m)));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Failed to change visibility');
    }
  };

    if (!token) {
      alert('Please login as admin to update layout');
      return;
    }
    setSavingConfig(true);
    try {
      const payload = {
        heroTitle: homeConfig.heroTitle,
        heroSubtitle: homeConfig.heroSubtitle,
        showTrending: !!homeConfig.showTrending,
        showSearch: !!homeConfig.showSearch,
        showGenres: !!homeConfig.showGenres,
      };
      const res = await axios.put(`${API}/home-config`, payload, {
        headers: { 'x-auth-token': token },
      });
      setHomeConfig(res.data.config);
      alert('Home layout updated');
    } catch (err) {
      console.error(err);
      alert('Failed to update home layout');
    } finally {
      setSavingConfig(false);
    }
  };

  if (!token) {
    return (
      <div className="admin-auth">
        <h2>Admin</h2>
        <div className="auth-grid">
          <div>
            <h3>Login</h3>
            <LoginForm onLogin={handleLogin} />
          </div>
          <div>
            <h3>Register</h3>
            <RegisterForm onRegister={handleLogin} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p className="admin-subtitle">Manage movies and control the home page layout.</p>
        </div>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <button
            type="button"
            className={activeTab === 'overview' ? 'admin-nav-item active' : 'admin-nav-item'}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            className={activeTab === 'layout' ? 'admin-nav-item active' : 'admin-nav-item'}
            onClick={() => setActiveTab('layout')}
          >
            Home Layout
          </button>
          <button
            type="button"
            className={activeTab === 'movies' ? 'admin-nav-item active' : 'admin-nav-item'}
            onClick={() => setActiveTab('movies')}
          >
            Movies
          </button>
        </aside>

        <div className="admin-content">
          {activeTab === 'overview' && (
            <div className="admin-grid">
              <section className="admin-panel">
                <h3>Quick Stats</h3>
                <div className="admin-stats-row">
                  <div className="admin-stat-card">
                    <span className="admin-stat-label">Total Movies</span>
                    <span className="admin-stat-value">{movies.length}</span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-label">Trending</span>
                    <span className="admin-stat-value">
                      {homeConfig?.showTrending !== false ? 'On' : 'Off'}
                    </span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-label">Search & Filter</span>
                    <span className="admin-stat-value">
                      {homeConfig?.showSearch !== false ? 'On' : 'Off'}
                    </span>
                  </div>
                  <div className="admin-stat-card">
                    <span className="admin-stat-label">Genres Section</span>
                    <span className="admin-stat-value">
                      {homeConfig?.showGenres !== false ? 'On' : 'Off'}
                    </span>
                  </div>
                </div>
              </section>

              <section className="admin-panel">
                <h3>Upload New Movie</h3>
                <p className="admin-panel-help">
                  Upload posters, screenshots, and basic details. New movies appear on the home page and in search.
                </p>
                <UploadForm token={token} onUploaded={handleUploaded} />
              </section>
            </div>
          )}

          {activeTab === 'layout' && (
            <section className="admin-panel">
              <h3>Home Layout Settings</h3>
              <p className="admin-panel-help">
                Control what sections are visible on the home page and customize the hero text.
              </p>
              {!homeConfig ? (
                <p>Loading layout settings...</p>
              ) : (
                <div className="form-grid">
                  <label>
                    Hero Title
                    <input
                      type="text"
                      value={homeConfig.heroTitle || ''}
                      onChange={(e) => handleConfigChange('heroTitle', e.target.value)}
                    />
                  </label>
                  <label>
                    Hero Subtitle
                    <textarea
                      rows={3}
                      value={homeConfig.heroSubtitle || ''}
                      onChange={(e) => handleConfigChange('heroSubtitle', e.target.value)}
                    />
                  </label>

                  <div className="toggle-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={homeConfig.showTrending !== false}
                        onChange={(e) => handleConfigChange('showTrending', e.target.checked)}
                      />
                      Show Trending Banner
                    </label>
                  </div>
                  <div className="toggle-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={homeConfig.showSearch !== false}
                        onChange={(e) => handleConfigChange('showSearch', e.target.checked)}
                      />
                      Show Search & Filter
                    </label>
                  </div>
                  <div className="toggle-row">
                    <label>
                      <input
                        type="checkbox"
                        checked={homeConfig.showGenres !== false}
                        onChange={(e) => handleConfigChange('showGenres', e.target.checked)}
                      />
                      Show Genre Sections
                    </label>
                  </div>

                  <button onClick={handleSaveConfig} disabled={savingConfig}>
                    {savingConfig ? 'Saving…' : 'Save Layout'}
                  </button>
                </div>
              )}
            </section>
          )}

          {activeTab === 'movies' && (
            <div className="admin-movies-layout">
              <section className="admin-panel full-width">
                <div className="admin-movies-header">
                  <h3>All Movies</h3>
                  <span>{movies.length} total</span>
                </div>
                <div className="admin-movie-grid">
                  {movies.map((m) => (
                    <div key={m._id} className="admin-movie-card">
                      {m.posterUrl && (
                        <img
                          src={m.posterUrl}
                          alt={m.title}
                        />
                      )}
                      <div className="admin-movie-info">
                        <strong>{m.title}</strong>
                        {m.year && <span className="admin-movie-year">{m.year}</span>}
                      </div>
                      <div className="admin-movie-actions">
                        <label className="switch-label">
                          <input
                            type="checkbox"
                            checked={m.isActive !== false}
                            onChange={() => toggleMovieActive(m)}
                          />
                          <span className="switch-text">
                            {m.isActive !== false ? 'Visible' : 'Hidden'}
                          </span>
                        </label>
                        <button type="button" onClick={() => startEditMovie(m)}>
                          Edit
                        </button>
                        <button type="button" onClick={() => handleDelete(m._id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {editingMovie && (
                <section className="admin-panel admin-edit-panel">
                  <h3>Edit Movie</h3>
                  <div className="form-grid">
                    <label>
                      Title
                      <input
                        type="text"
                        value={editingMovie.title}
                        onChange={(e) => handleEditFieldChange('title', e.target.value)}
                      />
                    </label>
                    <label>
                      Description
                      <textarea
                        rows={3}
                        value={editingMovie.description}
                        onChange={(e) => handleEditFieldChange('description', e.target.value)}
                      />
                    </label>
                    <label>
                      Year
                      <input
                        type="number"
                        value={editingMovie.year}
                        onChange={(e) => handleEditFieldChange('year', e.target.value)}
                      />
                    </label>
                    <label>
                      Tags (comma separated)
                      <input
                        type="text"
                        value={editingMovie.tags}
                        onChange={(e) => handleEditFieldChange('tags', e.target.value)}
                      />
                    </label>
                    <label className="switch-label">
                      <input
                        type="checkbox"
                        checked={editingMovie.isActive}
                        onChange={(e) => handleEditFieldChange('isActive', e.target.checked)}
                      />
                      <span className="switch-text">
                        Show on home page
                      </span>
                    </label>

                    <div className="admin-edit-actions">
                      <button type="button" onClick={handleSaveMovie}>
                        Save Changes
                      </button>
                      <button type="button" onClick={() => setEditingMovie(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
