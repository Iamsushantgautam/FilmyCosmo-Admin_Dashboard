import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await axios.get(`${API}/movies/${id}`);
        setMovie(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load movie details');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [id]);

  if (loading) return <div className="loader" aria-label="Loading movie..." />;
  if (error) return <p className="error">{error}</p>;
  if (!movie) return <p>Movie not found.</p>;

  const handleDownload = (quality) => {
    // Placeholder download behavior; hook this to real download links if available
    alert(`Starting download for "${movie.title}" in ${quality} quality (demo).`);
  };

  return (
    <div className="movie-detail">
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <div className="movie-detail-layout">
        <div className="movie-detail-poster">
          {movie.posterUrl && (
            <img src={movie.posterUrl} alt={movie.title} />
          )}
        </div>

        <div className="movie-detail-info">
          <h1>{movie.title}</h1>
          {movie.year && <p className="movie-year">{movie.year}</p>}
          {movie.tags && movie.tags.length > 0 && (
            <div className="movie-tags">
              {movie.tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                </span>
              ))}
            </div>
          )}
          {movie.description && <p className="movie-description">{movie.description}</p>}

          <div className="download-section">
            <h3>Download</h3>
            <div className="download-buttons">
              <button onClick={() => handleDownload('480p')}>Download 480p</button>
              <button onClick={() => handleDownload('720p')}>Download 720p</button>
              <button onClick={() => handleDownload('1080p')}>Download 1080p</button>
            </div>
          </div>
        </div>
      </div>

      {movie.screenshots && movie.screenshots.length > 0 && (
        <section className="screenshots-section">
          <h2>Screenshots</h2>
          <div className="screenshots-row">
            {movie.screenshots.map((src, index) => (
              <img key={index} src={src} alt={`Screenshot ${index + 1}`} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}


