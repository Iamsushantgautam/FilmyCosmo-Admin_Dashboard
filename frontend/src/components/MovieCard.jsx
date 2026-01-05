import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function MovieCard({ movie, compact = false }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/movie/${movie._id}`);
  };

  const primaryGenre = (movie.tags && movie.tags[0]) || 'Unknown';

  return (
    <div
      className={compact ? 'movie-card compact' : 'movie-card'}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
    >
      <div className="movie-card-poster-wrapper">
        {movie.posterUrl && (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="movie-card-poster"
          />
        )}
      </div>
      <h3 className="movie-card-title">{movie.title}</h3>
      <p className="movie-card-genre">{primaryGenre}</p>
    </div>
  );
}
