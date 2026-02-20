import { useState, useEffect, useRef } from 'react';
import './Home.css';
import { recommendationAPI } from '../utils/api';
import MovieCard from '../components/MovieCard';
import { useNavigate } from 'react-router-dom';

const LazyGenreRow = ({ genre, watchlistIds, onToggleWatchlist }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const rowRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (rowRef.current) observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const fetchMovies = async () => {
      setLoading(true);
      try {
        const res = await recommendationAPI.getAll(1, 12, genre, '');
        setMovies(res.data.movies || []);
      } catch (e) {
        console.error(`Error fetching ${genre}:`, e);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [isVisible, genre]);

  if (!isVisible && !loading && movies.length === 0) {
    return <div ref={rowRef} style={{ height: '400px', margin: '2rem 0' }}></div>;
  }

  if (movies.length === 0 && !loading) return null;

  return (
    <div key={genre} className="genre-row" ref={rowRef}>
      <div className="genre-row-header">
        <h2 className="genre-row-title">{genre} Movies</h2>
        <button className="btn-view-more" onClick={() => navigate(`/search?genre=${genre}`)}>
          View All →
        </button>
      </div>
      <div className="genre-row-scroll">
        <div className="genre-row-content">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="genre-movie-card skeleton" style={{ height: '350px', background: '#222', borderRadius: '12px' }}></div>
            ))
          ) : (
            movies.map(movie => (
              <div key={movie.movieId || movie.id} className="genre-movie-card">
                <MovieCard
                  movie={movie}
                  onToggleWatchlist={onToggleWatchlist}
                  isInWatchlist={watchlistIds.includes(movie.movieId || movie.id)}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const Home = ({ user, watchlistIds, onToggleWatchlist }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [arrivingSoonMovies, setArrivingSoonMovies] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

  const preferredGenres = user?.preferences?.preferred_genres || [];
  const mainGenres = preferredGenres.length > 0
    ? preferredGenres
    : ['Action', 'Comedy', 'Sci-Fi', 'Horror', 'Drama', 'Thriller', 'Animation'];

  // Initial Load - Only Hero Content
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // Fetch only Trending and Arriving Soon for the Hero section initially
        const [trendingRes, arrivingRes] = await Promise.all([
          recommendationAPI.getTrending(),
          recommendationAPI.getArrivingSoon()
        ]);

        if (trendingRes.data) {
          let trending = trendingRes.data;
          if (preferredGenres.length > 0) {
            trending = trending.filter(m =>
              m.genres_list?.some(g => preferredGenres.includes(g)) ||
              m.genres?.some(g => preferredGenres.includes(g.name))
            );
          }
          setTrendingMovies(trending.slice(0, 10));
        }

        if (arrivingRes.data) {
          let arriving = arrivingRes.data;
          if (preferredGenres.length > 0) {
            arriving = arriving.filter(m =>
              m.genres_list?.some(g => preferredGenres.includes(g)) ||
              m.genres?.some(g => preferredGenres.includes(g.name))
            );
          }
          setArrivingSoonMovies(arriving.slice(0, 10));
        }

      } catch (e) {
        console.error("Init Error", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const getPosterUrl = (movie) => {
    if (!movie.poster_path) return `https://placehold.co/1920x1080?text=${movie.title}`;
    if (movie.poster_path.startsWith('http')) return movie.poster_path;
    if (movie.poster_path.startsWith('/static')) return `http://localhost:5000${movie.poster_path}`;
    return `https://image.tmdb.org/t/p/original${movie.poster_path}`;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading your movie universe...</p>
      </div>
    );
  }

  const allHeroMovies = [...trendingMovies, ...arrivingSoonMovies];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero-dual-slider">
        <div className="hero-slides-container">
          {allHeroMovies.length > 0 ? (
            <>
              {[currentHeroIndex, currentHeroIndex + 1].map((idx, position) => {
                if (idx >= allHeroMovies.length) return null;
                const movie = allHeroMovies[idx];
                const isArriving = idx >= trendingMovies.length;
                const poster = getPosterUrl(movie);

                return (
                  <div
                    key={movie.movieId || movie.id}
                    className={`hero-dual-slide ${position === 0 ? 'left' : 'right'}`}
                    style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.9)), url(${poster})` }}
                  >
                    <div className="hero-dual-content">
                      <div className={`hero-badge ${isArriving ? 'arriving' : 'trending'}`}>
                        {isArriving ? 'Arriving Soon' : 'Trending Now'}
                      </div>
                      <h2 className="hero-dual-title">{movie.title}</h2>
                      <p className="hero-dual-overview">{movie.overview?.slice(0, 120)}...</p>
                      <div className="hero-dual-actions">
                        <button className="btn-hero-primary" onClick={() => navigate(`/movie/${movie.movieId || movie.id}`)}>
                          View Details
                        </button>
                        <button className="btn-hero-secondary" onClick={(e) => { e.stopPropagation(); onToggleWatchlist(movie); }}>
                          {watchlistIds.includes(movie.movieId || movie.id) ? '✓ In List' : '+ Watchlist'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="hero-dual-slide left">
              <div className="hero-dual-content">
                <h2>Welcome to MovieRec</h2>
                <p>Explore your next favorite film.</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Arrows */}
        <button
          className="hero-nav-btn prev"
          onClick={() => setCurrentHeroIndex(prev => prev - 2 < 0 ? Math.max(0, allHeroMovies.length - 2) : prev - 2)}
        >
          ‹
        </button>
        <button
          className="hero-nav-btn next"
          onClick={() => setCurrentHeroIndex(prev => prev + 2 >= allHeroMovies.length ? 0 : prev + 2)}
        >
          ›
        </button>
      </section>

      {/* Featured Sections */}
      <section className="genre-sections">
        <div className="genre-row">
          <div className="genre-row-header">
            <h2 className="genre-row-title">Trending This week</h2>
            <button className="btn-view-more" onClick={() => navigate('/trending')}>
              View All →
            </button>
          </div>
          <div className="genre-row-scroll">
            <div className="genre-row-content">
              {trendingMovies.map(movie => (
                <div key={movie.movieId || movie.id} className="genre-movie-card">
                  <MovieCard
                    movie={movie}
                    onToggleWatchlist={onToggleWatchlist}
                    isInWatchlist={watchlistIds.includes(movie.movieId || movie.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="genre-row">
          <div className="genre-row-header">
            <h2 className="genre-row-title">Arriving Soon</h2>
            <button className="btn-view-more" onClick={() => navigate('/viewall')}>
              View All →
            </button>
          </div>
          <div className="genre-row-scroll">
            <div className="genre-row-content">
              {arrivingSoonMovies.map(movie => (
                <div key={movie.movieId || movie.id} className="genre-movie-card">
                  <MovieCard
                    movie={movie}
                    onToggleWatchlist={onToggleWatchlist}
                    isInWatchlist={watchlistIds.includes(movie.movieId || movie.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Genre-Based Movie Rows - Now Lazy Loaded */}
        {mainGenres.map(genre => (
          <LazyGenreRow
            key={genre}
            genre={genre}
            watchlistIds={watchlistIds}
            onToggleWatchlist={onToggleWatchlist}
          />
        ))}
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>© 2024 MovieRec. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
