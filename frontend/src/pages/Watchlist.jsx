import { useState, useEffect } from 'react';
import { watchlistAPI } from '../utils/api';
import MovieCard from '../components/MovieCard';
import './Recommendations.css';

const Watchlist = ({ user }) => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchWatchlist = async () => {
            try {
                setLoading(true);
                const response = await watchlistAPI.get();
                setMovies(response.data);
            } catch (err) {
                console.error("Error fetching watchlist:", err);
                setError("Failed to load your watchlist.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchWatchlist();
        } else {
            setLoading(false);
        }
    }, [user]);

    const removeFromWatchlist = async (movie) => {
        const movieId = movie.movieId || movie.id;
        try {
            await watchlistAPI.remove(movieId);
            setMovies(prev => prev.filter(m => (m.movieId || m.id) !== movieId));
        } catch (err) {
            console.error("Error removing from watchlist:", err);
            alert("Failed to remove movie.");
        }
    };

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading your watchlist...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="error-screen">
                <p>Please log in to view your watchlist.</p>
            </div>
        );
    }

    return (
        <div className="recommendations-page">
            <header className="page-header">
                <h1>My <span className="highlight">Watchlist</span></h1>
                <p>Movies you've saved to watch later</p>
            </header>

            {movies.length > 0 ? (
                <section className="recs-section">
                    <div className="movies-grid">
                        {movies.map(movie => (
                            <MovieCard
                                key={movie.movieId || movie.id}
                                movie={movie}
                                onToggleWatchlist={removeFromWatchlist}
                                isInWatchlist={true}
                            />
                        ))}
                    </div>
                </section>
            ) : (
                <div className="empty-state">
                    <p>Your watchlist is empty.</p>
                    <p>Browse recommendations to find movies you'll love!</p>
                </div>
            )}
        </div>
    );
};

export default Watchlist;
