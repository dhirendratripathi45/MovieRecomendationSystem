import { useState, useEffect } from 'react';
import { recommendationAPI } from '../utils/api';
import MovieCard from '../components/MovieCard';
import './Recommendations.css';

const RatedMovies = ({ user }) => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRatedMovies = async () => {
            try {
                setLoading(true);
                const response = await recommendationAPI.getRatedMovies();
                setMovies(response.data);
            } catch (err) {
                console.error("Error fetching rated movies:", err);
                setError("Failed to load your rated movies.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchRatedMovies();
        } else {
            setLoading(false);
        }
    }, [user]);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading your ratings...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="error-screen">
                <p>Please log in to view your rated movies.</p>
            </div>
        );
    }

    return (
        <div className="recommendations-page">
            <header className="page-header">
                <h1>My <span className="highlight">Ratings</span></h1>
                <p>Movies you have rated</p>
            </header>

            {movies.length > 0 ? (
                <section className="recs-section">
                    <div className="movies-grid">
                        {movies.map(movie => (
                            <div key={movie.movieId || movie.id} style={{ position: 'relative' }}>
                                <MovieCard
                                    movie={movie}
                                    onToggleWatchlist={() => { }} // No-op or implement watchlist toggle if desired
                                    isInWatchlist={false} // Would need to check if in watchlist
                                />
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    left: '10px',
                                    background: 'rgba(0,0,0,0.8)',
                                    color: '#ffd700',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    zIndex: 10,
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <span>★</span> {movie.user_rating}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            ) : (
                <div className="empty-state">
                    <p>You haven't rated any movies yet.</p>
                    <p>Rate movies to get better recommendations!</p>
                </div>
            )}
        </div>
    );
};

export default RatedMovies;
