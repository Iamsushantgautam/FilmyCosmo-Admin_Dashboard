import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import MovieCard from '../components/MovieCard';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Home() {
  const [movies, setMovies] = useState([]);
  const [config, setConfig] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [loading, setLoading] = useState(true);

  // refs for horizontal carousels
  const trendingRef = useRef(null);
  const genreRefs = useRef({});

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [moviesRes, cfgRes] = await Promise.all([
          axios.get(`${API}/movies`),
          axios.get(`${API}/home-config`),
        ]);
        setMovies(moviesRes.data);
        setConfig(cfgRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const allGenresFromData = useMemo(() => {
    const set = new Set();
    movies.forEach((m) => {
      (m.tags || []).forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [movies]);

  const staticGenres = ['All', 'Action', 'Comedy', 'Drama', 'Horror', 'Sci Fi', 'Romance', 'Thriller', 'Animation'];

  const trendingMovies = useMemo(
    () => movies.slice(0, 8),
    [movies]
  );

  const filteredMovies = useMemo(() => {
    return movies.filter((m) => {
      if (m.isActive === false) return false;
      const matchesSearch =
        !search ||
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        (m.description || '').toLowerCase().includes(search.toLowerCase());
      const matchesGenre =
        selectedGenre === 'All' ||
        (m.tags || []).map((t) => t.toLowerCase()).includes(selectedGenre.toLowerCase());
      return matchesSearch && matchesGenre;
    });
  }, [movies, search, selectedGenre]);

  const moviesByGenre = useMemo(() => {
    const map = {};
    movies.forEach((m) => {
      if (m.isActive === false) return;
      (m.tags || ['Other']).forEach((t) => {
        if (!map[t]) map[t] = [];
        map[t].push(m);
      });
    });
    return map;
  }, [movies]);

  if (loading) {
    return <div className="loader" aria-label="Loading movies..." />;
  }

  const featuredMovie = trendingMovies[0] || movies[0] || null;
  const heroTitle = featuredMovie?.title || config?.heroTitle || 'Welcome to FilmyCosmo';
  const heroGenre = (featuredMovie?.tags && featuredMovie.tags[0]) || null;

  const scrollRow = (ref, direction = 'right') => {
    if (!ref?.current) return;
    const container = ref.current;
    const amount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === 'right' ? amount : -amount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        {featuredMovie?.posterUrl && (
          <div
            className="hero-background"
            style={{
              backgroundImage: `url(${featuredMovie.posterUrl})`,
            }}
          />
        )}
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-label">Featured Movie</div>
          <h1>{heroTitle}</h1>
          {heroGenre && <p className="hero-genre">{heroGenre}</p>}
        </div>
      </section>

      {/* Search & Filter */}
      {config?.showSearch !== false && (
        <section className="home-section">
          <div className="top-search-row">
            <div className="top-search-left">
              <input
                type="text"
                className="search-input"
                placeholder="Search movies by title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="genre-chip-row">
                {staticGenres.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={
                      g === selectedGenre
                        ? 'genre-chip active'
                        : 'genre-chip'
                    }
                    onClick={() => setSelectedGenre(g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="top-search-right">
              <button type="button" className="ghost-button">
                Filters
              </button>
              <select className="sort-select">
                <option value="latest">Sort: Latest</option>
                <option value="oldest">Sort: Oldest</option>
                <option value="az">Sort: A–Z</option>
              </select>
            </div>
          </div>

          <div className="grid-movies">
            {filteredMovies.length === 0 ? (
              <p>No movies match your search.</p>
            ) : (
              filteredMovies.map((movie) => (
                <MovieCard key={movie._id} movie={movie} />
              ))
            )}
          </div>
        </section>
      )}

      {/* Trending Banner */}
      {config?.showTrending !== false && trendingMovies.length > 0 && (
        <section className="home-section">
          <div className="section-header">
            <div className="section-header-left">
              <h2>Trending Now</h2>
              <span className="section-subtitle">Most recent uploads</span>
            </div>
            <div className="section-header-right">
              <button
                type="button"
                className="ghost-button"
                onClick={() => scrollRow(trendingRef, 'left')}
              >
                ‹
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => scrollRow(trendingRef, 'right')}
              >
                ›
              </button>
              <button
                type="button"
                className="view-all-button"
              >
                View All
              </button>
            </div>
          </div>
          <div className="horizontal-scroll hide-scrollbar" ref={trendingRef}>
            {trendingMovies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} compact />
            ))}
          </div>
        </section>
      )}

      {/* Genre Sections */}
      {config?.showGenres !== false && (
        <section className="home-section">
          <div className="section-header">
            <div className="section-header-left">
              <h2>Browse by Genre</h2>
            </div>
          </div>
          {Object.entries(moviesByGenre).map(([genre, list]) => {
            if (!genreRefs.current[genre]) {
              genreRefs.current[genre] = React.createRef();
            }
            return (
              <div key={genre} className="genre-block">
                <div className="section-header">
                  <div className="section-header-left">
                    <h3 className="genre-title">{genre}</h3>
                  </div>
                  <div className="section-header-right">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => scrollRow(genreRefs.current[genre], 'left')}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => scrollRow(genreRefs.current[genre], 'right')}
                    >
                      ›
                    </button>
                    <button type="button" className="view-all-button">
                      View All
                    </button>
                  </div>
                </div>
                <div
                  className="horizontal-scroll hide-scrollbar"
                  ref={genreRefs.current[genre]}
                >
                  {list.map((movie) => (
                    <MovieCard key={movie._id} movie={movie} compact />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
