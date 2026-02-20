import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { recommendationAPI } from '../utils/api';
import MovieCard from '../components/MovieCard';
import './Home.css';

const Search = ({ watchlistIds, onToggleWatchlist }) => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const genre = searchParams.get('genre') || '';
    const country = searchParams.get('country') || '';
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                // Fetch up to 50 results
                const res = await recommendationAPI.getAll(1, 100, genre, query, country);
                setMovies(res.data.movies || []);
            } catch (err) {
                console.error("Search error", err);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query, genre, country]);

    const getHeaderText = () => {
        if (query) return `Showing results for "${query}"`;
        if (genre) return `Movies in "${genre}" genre`;
        if (country) return `Movies from "${country}"`;
        return 'Browsing All Movies';
    };

    return (
        <div className="home" style={{ paddingTop: '100px', minHeight: '100vh', background: '#0a0a0a' }}>
            <div className="search-header" style={{ padding: '0 4rem', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.5rem', color: '#fff' }}>
                    {genre || country || 'Search Results'}
                </h1>
                <p style={{ color: '#aaa', fontSize: '1.2rem' }}>
                    {getHeaderText()}
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
                        <div className="empty-state-search" style={{ textAlign: 'center', padding: '4rem 0' }}>
                            <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>🎬</span>
                            <p className="empty-msg" style={{ fontSize: '1.5rem', color: '#888' }}>
                                {country
                                    ? `This ${country} movie is not available.`
                                    : genre
                                        ? `No movies found in "${genre}" genre.`
                                        : query
                                            ? `No movies found matching "${query}".`
                                            : "No movies found."}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Search;
