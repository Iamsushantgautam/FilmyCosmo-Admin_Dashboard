import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    movie_name: '', movie_year: '', movie_description: '', movie_tags: '', movie_poster: '',
    movie_genre: '', movie_duration: '', movie_language: '', movie_starcast: '', 
    movie_type: 'movie', movie_size: '',
    movie_show: true, movie_screenshots: '',
    download_links: '', short_links: ''
  });
  const [posterFile, setPosterFile] = useState(null);
  const [screenshotFiles, setScreenshotFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [linksUI, setLinksUI] = useState({ "1080p": [], "720p": [], "480p": [] });
  const [newQuality, setNewQuality] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchMovies = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/movies`, {
        headers: {
          'x-auth-token': token
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to fetch movies');
      setMovies(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  // Sync linksUI to formData.download_links whenever it changes
  useEffect(() => {
    // Strip UI-only fields like isEditing before saving to formData
    const cleanLinks = {};
    Object.keys(linksUI).forEach(quality => {
      cleanLinks[quality] = linksUI[quality].map(({ isEditing, ...rest }) => rest);
    });

    setFormData(prev => ({
      ...prev,
      download_links: JSON.stringify(cleanLinks, null, 2)
    }));
  }, [linksUI]);

  // --- Handlers ---

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPosterFile(e.target.files[0]);
    }
  };

  const handleScreenshotFileChange = (e) => {
    if (e.target.files) {
      setScreenshotFiles(e.target.files);
    }
  };

  const addLink = (quality) => {
    setLinksUI(prev => ({
      ...prev,
      [quality]: [...(prev[quality] || []), { label: 'GDrive', url: '', size: '', isEditing: true }]
    }));
  };

  const removeLink = (quality, index) => {
    setLinksUI(prev => ({
      ...prev,
      [quality]: prev[quality].filter((_, i) => i !== index)
    }));
  };

  const updateLink = (quality, index, field, value) => {
    setLinksUI(prev => {
      const list = [...(prev[quality] || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [quality]: list };
    });
  };

  const toggleLinkEdit = (quality, index) => {
    setLinksUI(prev => {
      const list = [...(prev[quality] || [])];
      list[index] = { ...list[index], isEditing: !list[index].isEditing };
      return { ...prev, [quality]: list };
    });
  };

  const removeQualitySection = (quality) => {
    if (window.confirm(`Delete entire ${quality} section?`)) {
      setLinksUI(prev => {
        const next = { ...prev };
        delete next[quality];
        return next;
      });
    }
  };

  const addQualitySection = () => {
    if (newQuality && !linksUI[newQuality]) {
      setLinksUI(prev => ({ ...prev, [newQuality]: [] }));
      setNewQuality('');
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setLinksUI({ "1080p": [], "720p": [], "480p": [] });
    setFormData({ 
      movie_name: '', movie_year: '', movie_description: '', movie_tags: '', movie_poster: '',
      movie_genre: '', movie_duration: '', movie_language: '', movie_starcast: '', 
      movie_type: 'movie', movie_size: '', 
      movie_show: true, movie_screenshots: '',
      download_links: '{}', short_links: '{}'
    });
    setPosterFile(null);
    setScreenshotFiles([]);
    setShowModal(true);
  };

  const openEditModal = (movie) => {
    setIsEditing(true);
    setCurrentId(movie._id);
    
    const dl = movie.download_links || {};
    // Initialize links with isEditing: false
    const processedDL = {};
    Object.keys(dl).forEach(k => {
      if (Array.isArray(dl[k])) {
        processedDL[k] = dl[k].map(link => ({ label: '', url: '', size: '', ...link, isEditing: false }));
      }
    });
    setLinksUI({ "1080p": [], "720p": [], "480p": [], ...processedDL });

    // Helper to safely join arrays or return string
    const join = (val) => Array.isArray(val) ? val.join(', ') : (val || '');

    setFormData({
      movie_name: movie.movie_name || movie.title || '',
      movie_year: movie.movie_year || movie.year || '',
      movie_description: movie.movie_description || movie.description || '',
      movie_tags: join(movie.movie_tags || movie.tags),
      movie_poster: movie.movie_poster || movie.posterUrl || '',
      movie_genre: join(movie.movie_genre),
      movie_duration: movie.movie_duration || '',
      movie_language: join(movie.movie_language),
      movie_starcast: join(movie.movie_starcast),
      movie_type: movie.movie_type || 'movie',
      movie_size: movie.movie_size || '',
      movie_show: (movie.movie_show !== undefined) ? movie.movie_show : (movie.isActive !== false),
      movie_screenshots: join(movie.movie_screenshots),
      download_links: JSON.stringify(movie.download_links || {}, null, 2),
      short_links: JSON.stringify(movie.short_links || {}, null, 2)
    });
    setPosterFile(null); // Reset file input, editing usually keeps old image unless changed
    setScreenshotFiles([]);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this movie?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/movies/${id}`, {
        method: 'DELETE',
        headers: { 'x-auth-token': token }
      });

      let data;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        data = { msg: await res.text() };
      }

      if (!res.ok) {
        throw new Error(data.msg || data.error || 'Failed to delete');
      }
      setMovies(prev => prev.filter(m => m._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem('token');
    
    try {
      // Use FormData for both Create and Update to support file uploads
      const data = new FormData();
      data.append('movie_name', formData.movie_name);
      data.append('movie_description', formData.movie_description);
      data.append('movie_year', formData.movie_year);
      data.append('movie_tags', formData.movie_tags);
      data.append('movie_genre', formData.movie_genre);
      data.append('movie_duration', formData.movie_duration);
      data.append('movie_language', formData.movie_language);
      data.append('movie_starcast', formData.movie_starcast);
      data.append('movie_type', formData.movie_type);
      data.append('movie_size', formData.movie_size);
      data.append('download_links', formData.download_links);
      data.append('short_links', formData.short_links);
      data.append('movie_show', formData.movie_show);
      data.append('movie_screenshots', formData.movie_screenshots);

      // --- Legacy Support ---
      // Send old field names too, in case the backend server wasn't restarted
      data.append('title', formData.movie_name);
      data.append('description', formData.movie_description);
      data.append('year', formData.movie_year);
      data.append('tags', formData.movie_tags);
      data.append('isActive', formData.movie_show);
      if (formData.movie_poster) {
        data.append('posterUrl', formData.movie_poster);
      }
      // ----------------------

      if (posterFile) {
        data.append('poster', posterFile);
      } else if (formData.movie_poster) {
        data.append('movie_poster', formData.movie_poster);
      }

      if (screenshotFiles && screenshotFiles.length > 0) {
        for (let i = 0; i < screenshotFiles.length; i++) {
          data.append('screenshots', screenshotFiles[i]);
        }
      }

      let url = `${API}/movies`;
      let method = 'POST';

      if (isEditing) {
        url = `${API}/movies/${currentId}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method: method,
        headers: { 'x-auth-token': token },
        body: data
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.msg || 'Operation failed');
      }
      
      fetchMovies();
      setShowModal(false);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMovies = movies.filter(movie => {
    const name = movie.movie_name || movie.title || '';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const tagFilter = searchParams.get('tag');
    const typeFilter = searchParams.get('type');

    let matchesTag = true;
    if (tagFilter) {
      const tags = movie.movie_tags || movie.tags || [];
      matchesTag = tags.some(t => t.toLowerCase() === tagFilter.toLowerCase());
    }

    const matchesType = typeFilter ? (movie.movie_type === typeFilter) : true;
    return matchesSearch && matchesTag && matchesType;
  });

  if (loading) return <div style={{ padding: '20px', color: 'white' }}>Loading dashboard...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

  return (
    <div className="dashboard-container">
      <style>{`
        .dashboard-container { padding: 20px; color: #fff; max-width: 1400px; margin: 0 auto; }
        .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px; }
        .header-title h1 { margin: 0; font-size: 2rem; color: #fff; }
        .header-title p { color: #aaa; margin: 5px 0 0 0; }
        .btn-primary { background: #e50914; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 1rem; transition: background 0.2s; }
        .btn-primary:hover { background: #f40612; }
        
        .search-input { padding: 12px 15px; width: 100%; max-width: 400px; background: #333; border: 1px solid #444; color: white; border-radius: 4px; margin-bottom: 25px; font-size: 1rem; transition: border-color 0.2s; }
        .search-input:focus { border-color: #e50914; outline: none; }

        .movie-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 25px; }
        .movie-card { background: #222; border-radius: 8px; overflow: hidden; position: relative; display: flex; flex-direction: column; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
        .movie-card:hover { transform: translateY(-5px); box-shadow: 0 8px 15px rgba(0,0,0,0.5); }
        .card-poster { height: 340px; overflow: hidden; background: #333; position: relative; }
        .card-poster img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
        .movie-card:hover .card-poster img { transform: scale(1.05); }
        .card-content { padding: 15px; flex: 1; display: flex; flex-direction: column; }
        .card-title { margin: 0 0 8px 0; font-size: 1.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff; }
        .card-details { font-size: 0.9rem; color: #bbb; margin-bottom: 15px; line-height: 1.4; }
        .card-details p { margin: 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-details strong { color: #888; font-weight: normal; margin-right: 5px; }
        .card-actions { display: flex; gap: 10px; margin-top: auto; }
        .btn-edit { flex: 1; padding: 8px; background: #444; border: none; color: white; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
        .btn-edit:hover { background: #555; }
        .btn-delete { flex: 1; padding: 8px; background: #d32f2f; border: none; color: white; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
        .btn-delete:hover { background: #b71c1c; }

        /* Modal Styles */
        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 2000; padding: 20px; backdrop-filter: blur(3px); }
        .modal-content { background: #1f1f1f; padding: 30px; border-radius: 12px; width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 50px rgba(0,0,0,0.5); border: 1px solid #333; }
        .modal-header { margin-top: 0; margin-bottom: 25px; border-bottom: 1px solid #333; padding-bottom: 15px; font-size: 1.5rem; color: #fff; }
        .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-group { margin-bottom: 18px; }
        .form-label { display: block; margin-bottom: 8px; color: #aaa; font-size: 0.9rem; font-weight: 500; }
        .form-input, .form-select, .form-textarea { width: 100%; padding: 12px; background: #2a2a2a; border: 1px solid #444; color: white; border-radius: 6px; font-size: 0.95rem; transition: border-color 0.2s; box-sizing: border-box; }
        .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: #e50914; outline: none; background: #333; }
        .form-row { display: flex; gap: 20px; }
        .form-col { flex: 1; }
        
        .download-section { border: 1px solid #444; padding: 20px; border-radius: 8px; background: #252525; margin-bottom: 20px; }
        .quality-group { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #333; }
        .quality-group:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .quality-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .quality-title { margin: 0; text-transform: uppercase; color: #e50914; font-size: 0.9rem; font-weight: bold; letter-spacing: 0.5px; }
        .link-row { display: flex; gap: 10px; margin-bottom: 10px; align-items: center; }
        .btn-sm { padding: 6px 12px; font-size: 0.8rem; border-radius: 4px; cursor: pointer; border: none; color: white; transition: opacity 0.2s; }
        .btn-icon { display: flex; align-items: center; justify-content: center; padding: 6px; }
        .link-text { padding: 6px; background: #333; border-radius: 4px; font-size: 0.9rem; color: #ddd; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .btn-sm:hover { opacity: 0.8; }
        .btn-add { background: #444; }
        .btn-remove { background: #d32f2f; padding: 6px 10px; }
        .btn-section-del { background: #d32f2f; font-size: 0.7rem; padding: 4px 8px; }
        
        .checkbox-group { display: flex; align-items: center; gap: 12px; margin-top: 10px; padding: 10px; background: #2a2a2a; border-radius: 6px; border: 1px solid #444; }
        .checkbox-group input { width: 18px; height: 18px; cursor: pointer; accent-color: #e50914; }
        .checkbox-group label { cursor: pointer; color: #fff; font-weight: 500; }
        
        .modal-actions { display: flex; gap: 15px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333; }
        .btn-cancel { flex: 1; padding: 14px; background: transparent; border: 1px solid #555; color: #ddd; cursor: pointer; border-radius: 6px; font-weight: 500; transition: all 0.2s; }
        .btn-cancel:hover { background: #333; color: #fff; border-color: #777; }
        .btn-save { flex: 1; padding: 14px; background: #e50914; border: none; color: white; cursor: pointer; border-radius: 6px; font-weight: bold; font-size: 1rem; transition: background 0.2s; }
        .btn-save:hover { background: #f40612; }
        .btn-save:disabled { opacity: 0.7; cursor: not-allowed; }

        @media (max-width: 768px) {
          .form-row { flex-direction: column; gap: 15px; }
          .link-row { flex-wrap: wrap; }
          .link-row input { flex: 1 1 100%; }
          .modal-grid { grid-template-columns: 1fr; }
          .link-row .btn-remove { flex: 1; }
          .modal-content { padding: 20px; width: 95%; }
        }
      `}</style>

      <div className="header-row">
        <div className="header-title">
          <h1>Movies</h1>
          <p>Manage your collection ({movies.length})</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          + Add Movie
        </button>
      </div>

      <input
        type="text"
        className="search-input"
        placeholder="Search movies by title..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      
      <div className="movie-grid">
        {filteredMovies.map(movie => (
          <div key={movie._id} className="movie-card">
            <div className="card-poster">
              {(movie.movie_poster || movie.posterUrl) ? (
                <img 
                  src={movie.movie_poster || movie.posterUrl} 
                  alt={movie.movie_name || movie.title} 
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#777' }}>
                  No Poster
                </div>
              )}
            </div>
            <div className="card-content">
              <h3 className="card-title">{movie.movie_name || movie.title}</h3>
              
              <div className="card-details">
                <p style={{ margin: '2px 0' }}><strong>Year:</strong> {movie.movie_year || movie.year}</p>
                <p style={{ margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><strong>Genre:</strong> {Array.isArray(movie.movie_genre) ? movie.movie_genre.join(', ') : (movie.movie_genre || '-')}</p>
                <p style={{ margin: '2px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><strong>Tags:</strong> {Array.isArray(movie.movie_tags) ? movie.movie_tags.join(', ') : (movie.movie_tags || (Array.isArray(movie.tags) ? movie.tags.join(', ') : '-'))}</p>
              </div>
              
              <div className="card-actions">
                <button onClick={() => openEditModal(movie)} className="btn-edit">
                  Edit
                </button>
                <button onClick={() => handleDelete(movie._id)} className="btn-delete">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-header">{isEditing ? 'Edit Movie' : 'Add New Movie'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Movie Title *</label>
                <input className="form-input" name="movie_name" placeholder="e.g. John Wick" value={formData.movie_name} onChange={handleInputChange} required />
              </div>
              
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <input className="form-input" name="movie_year" type="number" placeholder="2024" value={formData.movie_year} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration</label>
                  <input className="form-input" name="movie_duration" placeholder="e.g. 1h 41m" value={formData.movie_duration} onChange={handleInputChange} />
                </div>
              </div>

              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Genres</label>
                  <input className="form-input" name="movie_genre" placeholder="Action, Drama" value={formData.movie_genre} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Languages</label>
                  <input className="form-input" name="movie_language" placeholder="English, Hindi" value={formData.movie_language} onChange={handleInputChange} />
                </div>
              </div>

              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Starcast</label>
                  <input className="form-input" name="movie_starcast" placeholder="Actor 1, Actor 2" value={formData.movie_starcast} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Tags (SEO)</label>
                  <input className="form-input" name="movie_tags" placeholder="Bollywood, Action" value={formData.movie_tags} onChange={handleInputChange} />
                </div>
              </div>

              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" name="movie_type" value={formData.movie_type} onChange={handleInputChange}>
                    <option value="movie">Movie</option>
                    <option value="webseries">Web Series</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Size</label>
                  <input className="form-input" name="movie_size" placeholder="e.g. 2.4GB" value={formData.movie_size} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" name="movie_description" placeholder="Movie plot..." rows="3" value={formData.movie_description} onChange={handleInputChange} />
              </div>

              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Screenshot URLs (Text)</label>
                  <textarea className="form-textarea" name="movie_screenshots" placeholder="http://..." rows="2" value={formData.movie_screenshots} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Upload Screenshots (Device)</label>
                  <input type="file" multiple accept="image/*" onChange={handleScreenshotFileChange} style={{ color: '#aaa', marginTop: '5px' }} />
                </div>
              </div>

              <div className="download-section">
                <h3 style={{ marginTop: 0, color: '#e50914', fontSize: '1.1rem', marginBottom: '15px' }}>Download Links</h3>
                {Object.keys(linksUI).map(quality => (
                  <div key={quality} className="quality-group">
                    <div className="quality-header">
                      <h4 className="quality-title">{quality}</h4>
                      <button type="button" onClick={() => removeQualitySection(quality)} className="btn-sm btn-section-del">Delete Section</button>
                    </div>
                    {linksUI[quality].length > 0 && (
                      <div style={{ display: 'flex', gap: '5px', marginBottom: '5px', color: '#aaa', fontSize: '0.75rem', paddingLeft: '2px' }}>
                        <span style={{ width: '80px' }}>Source</span>
                        <span style={{ flex: 1 }}>Download URL</span>
                        <span style={{ width: '60px' }}>Size</span>
                        <span style={{ width: '24px' }}></span>
                      </div>
                    )}
                    {linksUI[quality].map((link, idx) => (
                      <div key={idx} className="link-row">
                        {link.isEditing ? (
                          <>
                            <input className="form-input" style={{ width: '80px', padding: '6px' }} placeholder="Label" value={link.label || ''} onChange={(e) => updateLink(quality, idx, 'label', e.target.value)} />
                            <input className="form-input" style={{ flex: 1, padding: '6px' }} placeholder="URL" value={link.url || ''} onChange={(e) => updateLink(quality, idx, 'url', e.target.value)} />
                            <input className="form-input" style={{ width: '60px', padding: '6px' }} placeholder="Size" value={link.size || ''} onChange={(e) => updateLink(quality, idx, 'size', e.target.value)} />
                            <button type="button" onClick={() => toggleLinkEdit(quality, idx)} className="btn-sm btn-icon" style={{ background: '#4CAF50' }} title="Save Link">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="link-text" style={{ width: '80px' }}>{link.label}</span>
                            <span className="link-text" style={{ flex: 1 }}>{link.url}</span>
                            <span className="link-text" style={{ width: '60px' }}>{link.size}</span>
                            <button type="button" onClick={() => toggleLinkEdit(quality, idx)} className="btn-sm btn-icon" style={{ background: '#2196F3' }} title="Edit Link">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                            </button>
                          </>
                        )}
                        
                        <button type="button" onClick={() => removeLink(quality, idx)} className="btn-sm btn-remove btn-icon" title="Remove Link">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => addLink(quality)} className="btn-sm btn-add">+ Add Link</button>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: '5px', marginTop: '10px', borderTop: '1px solid #444', paddingTop: '10px' }}>
                  <input className="form-input" style={{ padding: '6px' }} placeholder="New Quality (e.g. 4k)" value={newQuality} onChange={(e) => setNewQuality(e.target.value)} />
                  <button type="button" onClick={addQualitySection} className="btn-sm" style={{ background: '#e50914' }}>Add Section</button>
                </div>
              </div>

              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Poster Image (Upload)</label>
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ color: '#aaa' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Poster URL (Fallback)</label>
                  <input className="form-input" name="movie_poster" placeholder="https://..." value={formData.movie_poster} onChange={handleInputChange} />
                </div>
              </div>

              <div className="checkbox-group">
                <input type="checkbox" name="movie_show" checked={formData.movie_show} onChange={handleInputChange} id="movie_show" />
                <label htmlFor="movie_show">Visible (Show on Home)</label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-save">
                  {submitting ? 'Saving...' : 'Save Movie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}