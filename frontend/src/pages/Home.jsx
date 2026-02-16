import { useState, useEffect } from 'react';
import './Home.css';
import { recommendationAPI, watchlistAPI } from '../utils/api';
import MovieCard from '../components/MovieCard';
import { useNavigate } from 'react-router-dom';

const Home = ({ user, watchlistIds, onToggleWatchlist }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [arrivingSoonMovies, setArrivingSoonMovies] = useState([]);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [genreMovies, setGenreMovies] = useState({});
  const [allGenres, setAllGenres] = useState([]);

  const mainGenres = ['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Thriller', 'Romance', 'Horror', 'Animation'];

  // Initial Load
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        // Fetch Trending & Arriving Soon
        const [trendingRes, arrivingRes, genresRes] = await Promise.all([
          recommendationAPI.getTrending(),
          recommendationAPI.getArrivingSoon(),
          recommendationAPI.getGenres()
        ]);

        if (trendingRes.data) setTrendingMovies(trendingRes.data.slice(0, 6));
        if (arrivingRes.data) setArrivingSoonMovies(arrivingRes.data.slice(0, 6));
        if (genresRes.data) setAllGenres(genresRes.data);

        // Fetch movies for each main genre
        const genrePromises = mainGenres.map(async (genre) => {
          try {
            const res = await recommendationAPI.getAll(1, 10, genre, '');
            return { genre, movies: res.data.movies || [] };
          } catch (e) {
            console.error(`Error fetching ${genre}:`, e);
            return { genre, movies: [] };
          }
        });

        const genreResults = await Promise.all(genrePromises);
        const genreMap = {};
        genreResults.forEach(({ genre, movies }) => {
          genreMap[genre] = movies;
        });
        setGenreMovies(genreMap);

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
      {/* Hero Section - 2 Slides at Once */}
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

      {/* Genre-Based Movie Rows */}
      <section className="genre-sections">
        {mainGenres.map(genre => {
          const movies = genreMovies[genre] || [];
          if (movies.length === 0) return null;

          return (
            <div key={genre} className="genre-row">
              <div className="genre-row-header">
                <h2 className="genre-row-title">{genre} Movies</h2>
                <button className="btn-view-more" onClick={() => navigate(`/browse?genre=${genre}`)}>
                  View All →
                </button>
              </div>
              <div className="genre-row-scroll">
                <div className="genre-row-content">
                  {movies.map(movie => (
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
          );
        })}
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>© 2024 MovieRec. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;