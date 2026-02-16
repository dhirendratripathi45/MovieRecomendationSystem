import { useState, useEffect } from 'react';
import { recommendationAPI } from '../utils/api';
import MovieCard from '../components/MovieCard';
import './Home.css'; // Re-use Home styles for consistency

const Genres = ({ watchlistIds, onToggleWatchlist }) => {
    const [genreMovies, setGenreMovies] = useState({});
    const [loading, setLoading] = useState(true);

    const targetGenres = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Animation', 'Fantasy', 'Crime'];

    useEffect(() => {
        const fetchAllGenres = async () => {
            setLoading(true);
            try {
                const genrePromises = targetGenres.map(async (genre) => {
                    try {
                        const res = await recommendationAPI.getAll(1, 15, genre, ''); // Fetch 15 movies per genre
                        return { genre, movies: res.data.movies || [] };
                    } catch (e) {
                        return { genre, movies: [] };
                    }
                });

                const results = await Promise.all(genrePromises);
                const genreMap = {};
                results.forEach(({ genre, movies }) => {
                    if (movies.length > 0) {
                        genreMap[genre] = movies;
                    }
                });
                setGenreMovies(genreMap);
            } catch (err) {
                console.error("Error fetching genre movies", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllGenres();
    }, []);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Curating your collections...</p>
            </div>
        );
    }

    return (
        <div className="home" style={{ paddingTop: '100px' }}> {/* Reuse 'home' class for background */}
            <div className="genre-page-header" style={{ padding: '0 4rem', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: '800', marginBottom: '0.5rem' }}>Browse Categories</h1>
                <p style={{ color: '#aaa', fontSize: '1.2rem' }}>Explore our extensive collection sorted by genre.</p>
            </div>

            <section className="genre-sections">
                {targetGenres.map(genre => {
                    const movies = genreMovies[genre] || [];
                    if (movies.length === 0) return null;

                    return (
                        <div key={genre} className="genre-row">
                            <div className="genre-row-header">
                                <h2 className="genre-row-title">{genre}</h2>
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
        </div>
    );
};

export default Genres;
