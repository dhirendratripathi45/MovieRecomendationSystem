import React from 'react';
import './MovieCard.css';

// Module-level poster cache to avoid redundant API calls across MovieCard instances
const posterCache = new Map();

const MovieCard = ({ movie, onToggleWatchlist, isInWatchlist }) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [poster, setPoster] = React.useState(null);
    const cardRef = React.useRef(null);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, []);

    React.useEffect(() => {
        if (!isVisible) return;

        const cacheKey = movie.tmdbId || movie.movieId || movie.id;

        // Check cache first
        if (posterCache.has(cacheKey)) {
            setPoster(posterCache.get(cacheKey));
            return;
        }

        const fetchPoster = async () => {
            // 1. If poster_path already provided by backend API
            if (movie.poster_path && movie.poster_path !== 'None' && movie.poster_path !== 'null') {
                let url;
                if (movie.poster_path.startsWith('http')) {
                    url = movie.poster_path;
                } else if (movie.poster_path.startsWith('/static')) {
                    url = `http://localhost:5000${movie.poster_path}`;
                } else {
                    url = `https://image.tmdb.org/t/p/w300${movie.poster_path}`;
                }
                setPoster(url);
                posterCache.set(cacheKey, url);
                return;
            }

            // 2. Try OMDB by title (reliable, free, no auth issues)
            try {
                const omdbUrl = `https://www.omdbapi.com/?apikey=3fe0a4a2&t=${encodeURIComponent(movie.title)}`;
                const response = await fetch(omdbUrl);
                const data = await response.json();
                if (data && data.Poster && data.Poster !== 'N/A') {
                    setPoster(data.Poster);
                    posterCache.set(cacheKey, data.Poster);
                    return;
                }
            } catch (err) {
                // silently ignore
            }

            // 3. Try OMDB by IMDB ID if available
            if (movie.imdbId) {
                try {
                    const imdbId = movie.imdbId.startsWith('tt') ? movie.imdbId : `tt${movie.imdbId}`;
                    const omdbUrl = `https://www.omdbapi.com/?apikey=3fe0a4a2&i=${imdbId}`;
                    const response = await fetch(omdbUrl);
                    const data = await response.json();
                    if (data && data.Poster && data.Poster !== 'N/A') {
                        setPoster(data.Poster);
                        posterCache.set(cacheKey, data.Poster);
                        return;
                    }
                } catch (err) {
                    // silently ignore
                }
            }

            // 4. Final fallback - styled placeholder
            const placeholder = `https://placehold.co/300x450/1a1a2e/ffffff?text=${encodeURIComponent(movie.title || 'Movie')}`;
            setPoster(placeholder);
            posterCache.set(cacheKey, placeholder);
        };

        fetchPoster();
    }, [isVisible, movie.poster_path, movie.title, movie.tmdbId]);

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = `https://placehold.co/300x450/1a1a2e/ffffff?text=${encodeURIComponent(movie.title || 'Movie')}`;
    };

    // Safe navigation
    const handleClick = () => {
        const id = movie.movieId || movie.id;
        if (id) {
            window.location.href = `/movie/${id}`;
        }
    };

    // Safe genre rendering
    const renderGenres = () => {
        if (!movie.genres) return '';
        if (Array.isArray(movie.genres)) {
            return movie.genres.map(g => (typeof g === 'object' ? g.name : g)).join(', ');
        }
        return movie.genres;
    };

    const genresString = renderGenres();
    const firstGenre = genresString ? genresString.split(',')[0] : 'Unknown Genre';

    return (
        <div ref={cardRef} className="movie-grid-card" onClick={handleClick}>
            <div className="poster-container" style={{ background: '#1a1a1a' }}>
                {poster ? (
                    <img
                        src={poster}
                        alt={movie.title}
                        onError={handleImageError}
                    />
                ) : (
                    <div className="poster-placeholder" style={{ height: '380px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="spinner-small"></div>
                    </div>
                )}
                <div className="hover-overlay">
                    <button
                        className="quick-action-btn"
                        onClick={(e) => { e.stopPropagation(); onToggleWatchlist(movie); }}
                    >
                        {isInWatchlist ? 'Remove' : 'Add to Watchlist'}
                    </button>
                </div>
                <div className="movie-rating-badge">
                    ⭐ {movie.vote_average ? movie.vote_average.toFixed(1) : (movie.rating || 'N/A')}
                </div>
            </div>
            <div className="movie-grid-info">
                <h3>{movie.title}</h3>
                <div className="movie-grid-meta">
                    <span>{movie.release_year || movie.year || 'N/A'}</span>
                    <span>•</span>
                    <span>{firstGenre}</span>
                </div>
                {movie.description && (
                    <p className="movie-grid-description">
                        {movie.description}
                    </p>
                )}
                {movie.match_score && (
                    <div style={{ marginTop: 'auto', paddingTop: '0.5rem', color: '#ff2d7f', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        Match: {movie.match_score}%
                    </div>
                )}
            </div>
        </div>
    );
};

export default MovieCard;
