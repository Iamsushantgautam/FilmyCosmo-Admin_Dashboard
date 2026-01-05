import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/movies';

export default function MovieGrid() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMovies = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}?page=${pageNumber}&limit=15`);
      setMovies(res.data.movies);
      setPage(res.data.currentPage);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies(page);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchMovies(newPage);
  };

  if (loading) return <p>Loading movies...</p>;
  if (movies.length === 0) return <p>No movies found.</p>;

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '20px',
          padding: '20px 0',
        }}
      >
        {movies.map((movie) => (
          <div
            key={movie._id}
            style={{
              borderRadius: '8px',
              overflow: 'hidden',
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              textAlign: 'center',
              background: '#fff',
              transition: 'transform 0.2s',
            }}
          >
            <img
              src={movie.posterUrl}
              alt={movie.title}
              style={{
                width: '100%',
                height: '300px',
                objectFit: 'cover',
              }}
            />
            <h3 style={{ padding: '10px', fontSize: '1rem' }}>{movie.title}</h3>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', margin: '20px 0' }}>
        <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button onClick={() => handlePageChange(page + 1)} disabled={page === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}
