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
    movie_show: true, movie_screenshots: ''
  });
  const [posterFile, setPosterFile] = useState(null);
  const [screenshotFiles, setScreenshotFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [downloadLinks, setDownloadLinks] = useState([]);
  const [shortLinks, setShortLinks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [screenshotUrls, setScreenshotUrls] = useState([]);

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

  // Parse screenshot URLs from string
  useEffect(() => {
    if (formData.movie_screenshots) {
      const urls = formData.movie_screenshots.split(',').map(url => url.trim()).filter(url => url);
      setScreenshotUrls(urls);
    } else {
      setScreenshotUrls([]);
    }
  }, [formData.movie_screenshots]);

  // --- Handlers ---

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPosterFile(e.target.files[0]);
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, movie_poster: e.target.result }));
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleScreenshotFileChange = (e) => {
    if (e.target.files) {
      setScreenshotFiles(Array.from(e.target.files));
    }
  };

  const addDownloadLink = () => {
    setDownloadLinks(prev => [...prev, { label: '', url: '', size: '', click_count: 0 }]);
  };

  const removeDownloadLink = (index) => {
    setDownloadLinks(prev => prev.filter((_, i) => i !== index));
  };

  const updateDownloadLink = (index, field, value) => {
    setDownloadLinks(prev => prev.map((link, i) => 
      i === index ? { ...link, [field]: value } : link
    ));
  };

  const openAddModal = () => {
    setIsEditing(false);
    setDownloadLinks([]);
    setShortLinks([]);
    setFormData({ 
      movie_name: '', movie_year: '', movie_description: '', movie_tags: '', movie_poster: '',
      movie_genre: '', movie_duration: '', movie_language: '', movie_starcast: '', 
      movie_type: 'movie', movie_size: '', 
      movie_show: true, movie_screenshots: ''
    });
    setPosterFile(null);
    setScreenshotFiles([]);
    setScreenshotUrls([]);
    setShowModal(true);
  };

  const openEditModal = (movie) => {
    setIsEditing(true);
    setCurrentId(movie._id);

    // Helper to safely join arrays or return string
    const join = (val) => Array.isArray(val) ? val.join(', ') : (val || '');
    
    // Set download links
    const links = movie.download_links || [];
    setDownloadLinks(links.map(link => ({
      label: link.label || '',
      url: link.url || '',
      size: link.size || '',
      click_count: link.click_count || 0
    })));
    
    // Set short links
    const sLinks = movie.short_links || movie.shortLinks || [];
    setShortLinks(sLinks.map(link => ({
      label: link.label || '',
      url: link.url || '',
      original_url: link.original_url || link.url || '',
      size: link.size || '',
      click_count: link.click_count || 0
    })));

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
      movie_screenshots: join(movie.movie_screenshots || movie.screenshots)
    });
    setPosterFile(null);
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
      data.append('movie_show', formData.movie_show);
      data.append('movie_screenshots', formData.movie_screenshots);

      // Send download links as JSON array
      data.append('download_links', JSON.stringify(downloadLinks.filter(link => link.url && link.url.trim())));

      // Legacy Support
      data.append('title', formData.movie_name);
      data.append('description', formData.movie_description);
      data.append('year', formData.movie_year);
      data.append('tags', formData.movie_tags);
      data.append('isActive', formData.movie_show);
      if (formData.movie_poster && !posterFile) {
        data.append('posterUrl', formData.movie_poster);
        data.append('movie_poster', formData.movie_poster);
      }

      if (posterFile) {
        data.append('poster', posterFile);
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
        .dashboard-container { 
          padding: 20px; 
          color: #fff; 
          max-width: 1600px; 
          margin: 0 auto; 
          min-height: 100vh;
          background: #0a0a0a;
        }
        .header-row { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 30px; 
          flex-wrap: wrap; 
          gap: 15px; 
        }
        .header-title h1 { 
          margin: 0; 
          font-size: 2.5rem; 
          color: #fff; 
          font-weight: 700;
          background: linear-gradient(135deg, #e50914 0%, #f40612 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .header-title p { 
          color: #aaa; 
          margin: 8px 0 0 0; 
          font-size: 1rem;
        }
        .btn-primary { 
          background: linear-gradient(135deg, #e50914 0%, #f40612 100%);
          color: white; 
          border: none; 
          padding: 14px 28px; 
          border-radius: 8px; 
          cursor: pointer; 
          font-weight: 600; 
          font-size: 1rem; 
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(229, 9, 20, 0.3);
        }
        .btn-primary:hover { 
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(229, 9, 20, 0.4);
        }
        
        .search-input { 
          padding: 14px 20px; 
          width: 100%; 
          max-width: 500px; 
          background: #1a1a1a; 
          border: 2px solid #333; 
          color: white; 
          border-radius: 10px; 
          margin-bottom: 30px; 
          font-size: 1rem; 
          transition: all 0.3s;
        }
        .search-input:focus { 
          border-color: #e50914; 
          outline: none;
          background: #222;
          box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.1);
        }

        .movie-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
          gap: 30px; 
        }
        .movie-card { 
          background: linear-gradient(145deg, #1a1a1a 0%, #222 100%);
          border-radius: 12px; 
          overflow: hidden; 
          position: relative; 
          display: flex; 
          flex-direction: column; 
          transition: all 0.3s;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          border: 1px solid #2a2a2a;
        }
        .movie-card:hover { 
          transform: translateY(-8px); 
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
          border-color: #e50914;
        }
        .card-poster { 
          height: 380px; 
          overflow: hidden; 
          background: #1a1a1a; 
          position: relative; 
        }
        .card-poster img { 
          width: 100%; 
          height: 100%; 
          object-fit: cover; 
          transition: transform 0.4s; 
        }
        .movie-card:hover .card-poster img { 
          transform: scale(1.1); 
        }
        .card-content { 
          padding: 20px; 
          flex: 1; 
          display: flex; 
          flex-direction: column; 
        }
        .card-title { 
          margin: 0 0 12px 0; 
          font-size: 1.2rem; 
          font-weight: 600;
          color: #fff; 
          line-height: 1.4;
        }
        .card-details { 
          font-size: 0.9rem; 
          color: #bbb; 
          margin-bottom: 20px; 
          line-height: 1.6; 
        }
        .card-details p { 
          margin: 6px 0; 
        }
        .card-details strong { 
          color: #888; 
          font-weight: 500; 
          margin-right: 8px; 
        }
        .card-actions { 
          display: flex; 
          gap: 10px; 
          margin-top: auto; 
        }
        .btn-edit { 
          flex: 1; 
          padding: 10px; 
          background: #2a2a2a; 
          border: 1px solid #444; 
          color: white; 
          border-radius: 8px; 
          cursor: pointer; 
          transition: all 0.2s;
          font-weight: 500;
        }
        .btn-edit:hover { 
          background: #333; 
          border-color: #555;
        }
        .btn-delete { 
          flex: 1; 
          padding: 10px; 
          background: #d32f2f; 
          border: none; 
          color: white; 
          border-radius: 8px; 
          cursor: pointer; 
          transition: all 0.2s;
          font-weight: 500;
        }
        .btn-delete:hover { 
          background: #b71c1c; 
        }

        /* Modal Styles */
        .modal-overlay { 
          position: fixed; 
          top: 0; 
          left: 0; 
          right: 0; 
          bottom: 0; 
          background: rgba(0,0,0,0.92); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          z-index: 2000; 
          padding: 20px; 
          backdrop-filter: blur(5px); 
          overflow-y: auto;
        }
        .modal-content { 
          background: linear-gradient(145deg, #1a1a1a 0%, #222 100%);
          padding: 40px; 
          border-radius: 16px; 
          width: 100%; 
          max-width: 900px; 
          max-height: 95vh; 
          overflow-y: auto; 
          box-shadow: 0 25px 60px rgba(0,0,0,0.7); 
          border: 1px solid #333;
          margin: auto;
        }
        .modal-header { 
          margin-top: 0; 
          margin-bottom: 30px; 
          border-bottom: 2px solid #333; 
          padding-bottom: 20px; 
          font-size: 1.8rem; 
          color: #fff; 
          font-weight: 700;
        }
        .modal-grid { 
          display: grid; 
          grid-template-columns: 1fr 1fr; 
          gap: 20px; 
        }
        .form-group { 
          margin-bottom: 20px; 
        }
        .form-label { 
          display: block; 
          margin-bottom: 8px; 
          color: #ccc; 
          font-size: 0.95rem; 
          font-weight: 600; 
        }
        .form-input, .form-select, .form-textarea { 
          width: 100%; 
          padding: 12px 16px; 
          background: #2a2a2a; 
          border: 2px solid #444; 
          color: white; 
          border-radius: 8px; 
          font-size: 0.95rem; 
          transition: all 0.3s; 
          box-sizing: border-box;
          font-family: inherit;
        }
        .form-input:focus, .form-select:focus, .form-textarea:focus { 
          border-color: #e50914; 
          outline: none; 
          background: #333; 
          box-shadow: 0 0 0 3px rgba(229, 9, 20, 0.1);
        }
        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }
        
        .download-section { 
          border: 2px solid #333; 
          padding: 25px; 
          border-radius: 12px; 
          background: #1a1a1a; 
          margin-bottom: 25px; 
        }
        .download-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        .download-section-title { 
          margin: 0; 
          color: #e50914; 
          font-size: 1.2rem; 
          font-weight: 700;
        }
        .download-links-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .download-link-item {
          background: #222;
          border: 1px solid #333;
          border-radius: 8px;
          padding: 15px;
          display: grid;
          grid-template-columns: 120px 1fr 100px 80px auto;
          gap: 12px;
          align-items: center;
        }
        .download-link-item.editing {
          grid-template-columns: 120px 1fr 100px auto;
        }
        .link-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .link-field-label {
          font-size: 0.75rem;
          color: #888;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .link-field-input {
          padding: 8px 12px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 6px;
          color: white;
          font-size: 0.9rem;
        }
        .link-field-input:focus {
          outline: none;
          border-color: #e50914;
          background: #333;
        }
        .link-click-count {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #4CAF50;
          font-weight: 600;
          font-size: 0.9rem;
        }
        .link-actions {
          display: flex;
          gap: 8px;
        }
        .btn-icon-small {
          padding: 8px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          background: #333;
          color: white;
        }
        .btn-icon-small:hover {
          background: #444;
          transform: scale(1.1);
        }
        .btn-icon-small.delete {
          background: #d32f2f;
        }
        .btn-icon-small.delete:hover {
          background: #b71c1c;
        }
        .btn-add-link {
          background: #2a2a2a;
          border: 2px dashed #444;
          color: #ccc;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          font-weight: 500;
          margin-top: 10px;
        }
        .btn-add-link:hover {
          border-color: #e50914;
          background: #333;
          color: #fff;
        }

        .screenshots-section {
          margin-bottom: 25px;
        }
        .screenshots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        .screenshot-item {
          position: relative;
          aspect-ratio: 16/9;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid #333;
          background: #1a1a1a;
        }
        .screenshot-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .screenshot-remove {
          position: absolute;
          top: 5px;
          right: 5px;
          background: rgba(211, 47, 47, 0.9);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: all 0.2s;
        }
        .screenshot-remove:hover {
          background: rgba(183, 28, 28, 1);
          transform: scale(1.1);
        }
        
        .checkbox-group { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          margin-top: 15px; 
          padding: 15px; 
          background: #1a1a1a; 
          border-radius: 10px; 
          border: 2px solid #333; 
        }
        .checkbox-group input { 
          width: 20px; 
          height: 20px; 
          cursor: pointer; 
          accent-color: #e50914; 
        }
        .checkbox-group label { 
          cursor: pointer; 
          color: #fff; 
          font-weight: 500; 
        }
        
        .modal-actions { 
          display: flex; 
          gap: 15px; 
          margin-top: 30px; 
          padding-top: 25px; 
          border-top: 2px solid #333; 
        }
        .btn-cancel { 
          flex: 1; 
          padding: 14px; 
          background: transparent; 
          border: 2px solid #555; 
          color: #ddd; 
          cursor: pointer; 
          border-radius: 10px; 
          font-weight: 600; 
          transition: all 0.3s; 
        }
        .btn-cancel:hover { 
          background: #333; 
          color: #fff; 
          border-color: #777; 
        }
        .btn-save { 
          flex: 1; 
          padding: 14px; 
          background: linear-gradient(135deg, #e50914 0%, #f40612 100%);
          border: none; 
          color: white; 
          cursor: pointer; 
          border-radius: 10px; 
          font-weight: 700; 
          font-size: 1rem; 
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(229, 9, 20, 0.3);
        }
        .btn-save:hover { 
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(229, 9, 20, 0.4);
        }
        .btn-save:disabled { 
          opacity: 0.6; 
          cursor: not-allowed;
          transform: none;
        }

        .poster-preview {
          margin-top: 10px;
          max-width: 100%;
          border-radius: 8px;
          border: 2px solid #333;
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 15px;
          }
          .modal-content {
            padding: 25px;
            max-width: 100%;
          }
          .modal-grid { 
            grid-template-columns: 1fr; 
            gap: 15px;
          }
          .download-link-item {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .download-link-item.editing {
            grid-template-columns: 1fr;
          }
          .link-actions {
            justify-content: flex-end;
          }
          .movie-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 20px;
          }
          .header-title h1 {
            font-size: 2rem;
          }
        }
      `}</style>

      <div className="header-row">
        <div className="header-title">
          <h1>Movies Dashboard</h1>
          <p>Manage your collection ({movies.length} movies)</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          + Add New Movie
        </button>
      </div>

      <input
        type="text"
        className="search-input"
        placeholder="🔍 Search movies by title..."
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
                <p><strong>Year:</strong> {movie.movie_year || movie.year || 'N/A'}</p>
                <p><strong>Genre:</strong> {Array.isArray(movie.movie_genre) ? movie.movie_genre.join(', ') : (movie.movie_genre || '-')}</p>
                <p><strong>Type:</strong> {movie.movie_type || 'Movie'}</p>
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
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setShowModal(false)}>
          <div className="modal-content">
            <h2 className="modal-header">{isEditing ? '✏️ Edit Movie' : '➕ Add New Movie'}</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Movie Title *</label>
                <input className="form-input" name="movie_name" placeholder="e.g. John Wick" value={formData.movie_name} onChange={handleInputChange} required />
              </div>
              
              <div className="modal-grid">
                <div className="form-group">
                  <label className="form-label">Release Year</label>
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
                  <input className="form-input" name="movie_genre" placeholder="Action, Drama, Thriller" value={formData.movie_genre} onChange={handleInputChange} />
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
                  <label className="form-label">File Size</label>
                  <input className="form-input" name="movie_size" placeholder="e.g. 2.4GB" value={formData.movie_size} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" name="movie_description" placeholder="Enter movie plot and description..." rows="4" value={formData.movie_description} onChange={handleInputChange} />
              </div>

                <div className="form-group">
                <label className="form-label">Poster Image</label>
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ color: '#aaa', marginBottom: '10px' }} />
                {formData.movie_poster && (
                  <img src={formData.movie_poster} alt="Poster preview" className="poster-preview" style={{ maxWidth: '200px', display: 'block' }} />
                )}
                <input className="form-input" name="movie_poster" placeholder="Or enter poster URL..." value={formData.movie_poster} onChange={handleInputChange} style={{ marginTop: '10px' }} />
              </div>

              <div className="screenshots-section">
                <label className="form-label">Screenshots</label>
                <textarea className="form-textarea" name="movie_screenshots" placeholder="Enter screenshot URLs (comma separated)..." rows="2" value={formData.movie_screenshots} onChange={handleInputChange} />
                <input type="file" multiple accept="image/*" onChange={handleScreenshotFileChange} style={{ color: '#aaa', marginTop: '10px' }} />
                {screenshotUrls.length > 0 && (
                  <div className="screenshots-grid">
                    {screenshotUrls.map((url, idx) => (
                      <div key={idx} className="screenshot-item">
                        <img src={url} alt={`Screenshot ${idx + 1}`} />
                </div>
                    ))}
                </div>
                )}
              </div>

              <div className="download-section">
                <div className="download-section-header">
                  <h3 className="download-section-title">Download Links</h3>
                </div>
                <div className="download-links-list">
                  {downloadLinks.map((link, idx) => (
                    <div key={idx} className="download-link-item">
                      <div className="link-field">
                        <span className="link-field-label">Label</span>
                        <input 
                          className="link-field-input"
                          placeholder="GDrive, Mega, etc."
                          value={link.label}
                          onChange={(e) => updateDownloadLink(idx, 'label', e.target.value)}
                        />
                      </div>
                      <div className="link-field">
                        <span className="link-field-label">URL</span>
                        <input 
                          className="link-field-input"
                          placeholder="https://..."
                          value={link.url}
                          onChange={(e) => updateDownloadLink(idx, 'url', e.target.value)}
                        />
                    </div>
                      <div className="link-field">
                        <span className="link-field-label">Size</span>
                        <input 
                          className="link-field-input"
                          placeholder="2.4GB"
                          value={link.size}
                          onChange={(e) => updateDownloadLink(idx, 'size', e.target.value)}
                        />
                      </div>
                      {link.click_count !== undefined && (
                        <div className="link-click-count">
                          👆 {link.click_count || 0} clicks
                      </div>
                    )}
                      <div className="link-actions">
                        <button 
                          type="button" 
                          onClick={() => removeDownloadLink(idx)} 
                          className="btn-icon-small delete"
                          title="Remove link"
                        >
                          ✕
                        </button>
                      </div>
                  </div>
                ))}
                </div>
                <button type="button" onClick={addDownloadLink} className="btn-add-link">
                  + Add Download Link
                </button>
              </div>

              {shortLinks.length > 0 && (
                <div className="download-section" style={{ background: '#1a1a2e', borderColor: '#4a4a6a' }}>
                  <div className="download-section-header">
                    <h3 className="download-section-title" style={{ color: '#4CAF50' }}>🔗 Short Links (Auto-Generated)</h3>
                  </div>
                  <div className="download-links-list">
                    {shortLinks.map((link, idx) => (
                      <div key={idx} className="download-link-item" style={{ background: '#252538' }}>
                        <div className="link-field">
                          <span className="link-field-label">Label</span>
                          <input 
                            className="link-field-input"
                            value={link.label}
                            readOnly
                            style={{ background: '#1a1a2a', cursor: 'not-allowed', opacity: 0.8 }}
                          />
                        </div>
                        <div className="link-field">
                          <span className="link-field-label">Short URL</span>
                          <input 
                            className="link-field-input"
                            value={link.url}
                            readOnly
                            style={{ background: '#1a1a2a', cursor: 'not-allowed', opacity: 0.8 }}
                          />
                        </div>
                        <div className="link-field">
                          <span className="link-field-label">Size</span>
                          <input 
                            className="link-field-input"
                            value={link.size || ''}
                            readOnly
                            style={{ background: '#1a1a2a', cursor: 'not-allowed', opacity: 0.8 }}
                          />
                        </div>
                        {link.click_count !== undefined && (
                          <div className="link-click-count">
                            👆 {link.click_count || 0} clicks
                          </div>
                        )}
                        <div className="link-actions">
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn-icon-small"
                            style={{ background: '#4CAF50', textDecoration: 'none', padding: '8px 12px' }}
                            title="Open link"
                          >
                            ↗
                          </a>
                        </div>
                      </div>
                    ))}
                </div>
                  <p style={{ color: '#888', fontSize: '0.85rem', marginTop: '15px', fontStyle: 'italic' }}>
                    * Short links are automatically generated from download links when you save the movie.
                  </p>
                </div>
              )}

              <div className="checkbox-group">
                <input type="checkbox" name="movie_show" checked={formData.movie_show} onChange={handleInputChange} id="movie_show" />
                <label htmlFor="movie_show">Visible (Show on Home Page)</label>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-save">
                  {submitting ? 'Saving...' : (isEditing ? 'Update Movie' : 'Create Movie')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
