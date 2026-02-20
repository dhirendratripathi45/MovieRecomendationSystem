import { useState, useEffect } from 'react';
import { recommendationAPI } from '../utils/api';
import MovieCard from '../components/MovieCard';

const Trending = ({ user, watchlistIds, onToggleWatchlist }) => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrending = async () => {
            try {
                const res = await recommendationAPI.getTrending();
                let data = res.data || [];

                // Filter by preferred genres if available
                const preferredGenres = user?.preferences?.preferred_genres || [];
                if (preferredGenres.length > 0) {
                    data = data.filter(m =>
                        m.genres_list?.some(g => preferredGenres.includes(g)) ||
                        m.genres?.some(g => preferredGenres.includes(g.name))
                    );
                }

                setMovies(data);
            } catch (err) {
                console.error("Error fetching trending", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTrending();
    }, []);

    return (
        <div className="trending-page" style={{ padding: '2rem', color: 'white' }}>
            <h1 style={{ marginBottom: '2rem' }}>Trending Movies</h1>
            {loading ? <p>Loading...</p> : (
                <div className="movies-grid">
                    {movies.map(movie => (
                        <MovieCard
                            key={movie.movieId || movie.id}
                            movie={movie}
                            onToggleWatchlist={onToggleWatchlist}
                            isInWatchlist={watchlistIds.includes(movie.movieId || movie.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Trending;
