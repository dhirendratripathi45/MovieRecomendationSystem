import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { recommendationAPI } from '../utils/api';
import MovieCard from '../components/MovieCard';
import './Home.css';

const Search = ({ watchlistIds, onToggleWatchlist }) => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            if (!query.trim()) {
                setMovies([]);
                return;
            }
            setLoading(true);
            try {
                // Fetch up to 50 results
                const res = await recommendationAPI.getAll(1, 50, '', query);
                setMovies(res.data.movies || []);
            } catch (err) {
                console.error("Search error", err);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query]);

    return (
        <div className="home" style={{ paddingTop: '100px', minHeight: '100vh' }}>
            <div className="search-header" style={{ padding: '0 4rem', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.5rem' }}>
                    Search Results
                </h1>
                <p style={{ color: '#aaa', fontSize: '1.2rem' }}>
                    {query ? `Showing results for "${query}"` : 'Enter a search term to begin'}
                </p>
            </div>

            {loading ? (
                <div className="loading-screen" style={{ height: '50vh' }}>
                    <div className="loading-spinner"></div>
                </div>
            ) : (
                <div style={{ padding: '0 4rem' }}>
                    {movies.length > 0 ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                            gap: '2rem'
                        }}>
                            {movies.map(movie => (
                                <MovieCard
                                    key={movie.movieId || movie.id}
                                    movie={movie}
                                    onToggleWatchlist={onToggleWatchlist}
                                    isInWatchlist={watchlistIds.includes(movie.movieId || movie.id)}
                                />
                            ))}
                        </div>
                    ) : (
                        query && <p className="empty-msg">No movies found matching your search.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default Search;
