import React from 'react';
import './MovieCard.css';

const MovieCard = ({ movie, onToggleWatchlist, isInWatchlist }) => {
    const [poster, setPoster] = React.useState(null);

    React.useEffect(() => {
        const fetchPoster = async () => {
            if (movie.poster_path) {
                if (movie.poster_path.startsWith('http')) {
                    setPoster(movie.poster_path);
                } else if (movie.poster_path.startsWith('/static')) {
                    setPoster(`http://localhost:5000${movie.poster_path}`);
                } else {
                    setPoster(`https://image.tmdb.org/t/p/w500${movie.poster_path}`);
                }
                return;
            }

            // Desperate fetch from OMDB
            try {
                const omdbUrl = `https://www.omdbapi.com/?apikey=3fe0a4a2&t=${encodeURIComponent(movie.title)}`;
                const response = await fetch(omdbUrl);
                const data = await response.json();
                if (data && data.Poster && data.Poster !== 'N/A') {
                    setPoster(data.Poster);
                } else {
                    setPoster(`https://placehold.co/300x450?text=${encodeURIComponent(movie.title || 'Movie')}`);
                }
            } catch (err) {
                console.error("OMDB fetch error", err);
                setPoster(`https://placehold.co/300x450?text=${encodeURIComponent(movie.title || 'Movie')}`);
            }
        };

        fetchPoster();
    }, [movie.poster_path, movie.title]);

    const handleImageError = (e) => {
        e.target.onerror = null;
        e.target.src = `https://placehold.co/300x450?text=${encodeURIComponent(movie.title || 'Movie')}`;
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
        <div className="movie-grid-card" onClick={handleClick}>
            <div className="poster-container" style={{ background: '#1a1a1a' }}>
                {poster ? (
                    <img
                        src={poster}
                        alt={movie.title}
                        onError={handleImageError}
                        loading="lazy"
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
