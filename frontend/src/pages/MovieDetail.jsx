import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recommendationAPI } from '../utils/api';
import MovieCard from '../components/MovieCard';
import './MovieDetail.css';

const MovieDetail = ({ user, watchlistIds, onToggleWatchlist }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [similarMovies, setSimilarMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    // Derived state
    const isInWatchlist = movie ? watchlistIds.includes(movie.movieId || movie.id) : false;

    // Rating
    const [userRating, setUserRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [isRated, setIsRated] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                // Fetch Movie Info
                const res = await recommendationAPI.getMovie(id);
                setMovie(res.data);

                // Check if user has already rated
                if (res.data.user_rating) {
                    setUserRating(res.data.user_rating);
                    setIsRated(true);
                }

                // Fetch Similar Movies (Content Based)
                if (res.data.title) {
                    const simRes = await recommendationAPI.getContentBased(res.data.title);
                    setSimilarMovies(simRes.data);
                }

            } catch (err) {
                console.error("Error loading details", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleRate = async (score) => {
        if (isRated) return; // Prevent re-rating

        setUserRating(score);
        try {
            await recommendationAPI.rateMovie({
                // backend handles user_id from token
                movie_id: movie.movieId,
                score: score
            });
            setIsRated(true);
            alert(`You rated this movie ${score}/5!`);
        } catch (err) {
            console.error("Rating failed", err);
            setIsRated(false);
            setUserRating(0);
        }
    };

    const [poster, setPoster] = useState(null);

    useEffect(() => {
        if (!movie) return;

        const getPoster = async () => {
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

            // Try OMDB
            try {
                const res = await fetch(`https://www.omdbapi.com/?apikey=3fe0a4a2&t=${encodeURIComponent(movie.title)}`);
                const data = await res.json();
                if (data && data.Poster && data.Poster !== 'N/A') {
                    setPoster(data.Poster);
                } else {
                    setPoster(`https://placehold.co/300x450?text=${encodeURIComponent(movie.title)}`);
                }
            } catch (e) {
                setPoster(`https://placehold.co/300x450?text=${encodeURIComponent(movie.title)}`);
            }
        };

        getPoster();
    }, [movie]);

    if (loading) return <div className="loading">Loading...</div>;
    if (!movie) return <div className="error">Movie not found</div>;

    const backdropUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : poster;

    return (
        <div className="movie-detail-page">
            <div className="hero-backdrop" style={{
                backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.1), #141414), url(${backdropUrl})`
            }}>
                <div className="content-wrapper">
                    <div className="poster-section">
                        <img
                            src={poster}
                            alt={movie.title}
                            onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/300x450?text=${encodeURIComponent(movie.title)}`; }}
                        />
                    </div>
                    <div className="info-section">
                        <h1 className="movie-title">{movie.title} <span className="year">({movie.release_year})</span></h1>

                        <div className="meta-row">
                            <span className="match-score">96% Match</span>
                            <span className="year">{movie.release_year}</span>
                            <span className="rating-badge">12+</span>
                            <span className="duration">{movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'N/A'}</span>
                        </div>

                        <div className="actions-row">
                            <button
                                className="btn-play"
                                onClick={() => {
                                    if (movie.trailer_url) {
                                        window.open(movie.trailer_url, '_blank');
                                    } else if (movie.tmdbId) {
                                        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + " trailer")}`, '_blank');
                                    } else {
                                        window.open(`https://www.imdb.com/find?q=${encodeURIComponent(movie.title)}`, '_blank');
                                    }
                                }}
                            >
                                ▶ Play Trailer
                            </button>
                            <button className="btn-secondary" onClick={() => onToggleWatchlist(movie)}>
                                {isInWatchlist ? '✓ In Watchlist' : '+ My List'}
                            </button>
                            <div className="rating-stars" title={isRated ? "You have already rated this movie" : "Rate this movie"}>
                                {[1, 2, 3, 4, 5].map(star => (
                                    <span
                                        key={star}
                                        className={`star ${star <= (hoverRating || userRating) ? 'filled' : ''} ${isRated ? 'disabled' : ''}`}
                                        onMouseEnter={() => !isRated && setHoverRating(star)}
                                        onMouseLeave={() => !isRated && setHoverRating(0)}
                                        onClick={() => handleRate(star)}
                                        style={{ cursor: isRated ? 'default' : 'pointer', opacity: isRated ? 0.8 : 1 }}
                                    >★</span>
                                ))}
                                {isRated && <span style={{ marginLeft: '10px', fontSize: '0.8rem', color: '#aaa' }}>(Rated)</span>}
                            </div>
                        </div>

                        <p className="overview">
                            {movie.overview || "No overview available for this movie."}
                        </p>

                        <div className="details-list">
                            <p><strong>Genres:</strong> {movie.genres?.map(g => g.name || g).join(', ')}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="similar-movies-section">
                <h2>More Like This</h2>
                <div className="movies-grid">
                    {similarMovies.map(m => (
                        <MovieCard
                            key={m.movieId || m.id}
                            movie={m}
                            onToggleWatchlist={onToggleWatchlist}
                            isInWatchlist={watchlistIds.includes(m.movieId || m.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MovieDetail;
