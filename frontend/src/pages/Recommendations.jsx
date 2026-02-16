import { useState, useEffect } from 'react';
import './Recommendations.css';
import { recommendationAPI } from '../utils/api';
import MovieCard from '../components/MovieCard';

const Recommendations = ({ user, watchlistIds, onToggleWatchlist }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [trendingMovies, setTrendingMovies] = useState([]);
    const [mostRated, setMostRated] = useState([]);
    const [mostViewed, setMostViewed] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAllData = async () => {
            console.log("Fetching all data for user:", user?.id);
            try {
                setLoading(true);
                setError(null);

                if (user && user.id) {
                    // Fetch Personalized Hybrid Recommendations
                    try {
                        const recResponse = await recommendationAPI.getHybrid(user.id);
                        if (recResponse.data && Array.isArray(recResponse.data)) {
                            const mappedRecs = recResponse.data.map(m => ({
                                ...m,
                                genres: m.genres,
                            }));
                            setRecommendations(mappedRecs);
                        }
                    } catch (recError) {
                        console.error("Failed to fetch personalized recs:", recError);
                    }

                    // Always fetch trending
                    try {
                        const trendingResponse = await recommendationAPI.getTrending();
                        if (trendingResponse.data && Array.isArray(trendingResponse.data)) {
                            setTrendingMovies(trendingResponse.data.slice(0, 15));
                        }
                    } catch (trendError) {
                        console.error("Failed to fetch trending movies:", trendError);
                    }

                    // Fetch Most Rated
                    try {
                        const ratedRes = await recommendationAPI.getMostRated();
                        if (ratedRes.data && Array.isArray(ratedRes.data)) {
                            setMostRated(ratedRes.data);
                        }
                    } catch (e) { console.error("Most rated fetch failed", e); }

                    // Fetch Most Viewed (Searched)
                    try {
                        const viewedRes = await recommendationAPI.getMostViewed();
                        if (viewedRes.data && Array.isArray(viewedRes.data)) {
                            setMostViewed(viewedRes.data);
                        }
                    } catch (e) { console.error("Most viewed fetch failed", e); }

                } else {
                    setError("Please login to see personalized recommendations.");
                }
            } catch (err) {
                console.error('General error in Recommendations page:', err);
                setError("Something went wrong while loading recommendations.");
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchAllData();
        } else {
            setLoading(false);
        }
    }, [user]);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Finding the perfect movies for you...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-screen">
                <div className="error-icon">⚠️</div>
                <p>{error}</p>
                <button onClick={() => window.location.reload()} className="retry-btn">Retry</button>
            </div>
        );
    }

    const hasNoContent = recommendations.length === 0 && trendingMovies.length === 0;

    return (
        <div className="recommendations-page">
            <header className="page-header">
                <h1>Your <span className="highlight">Recommendations</span></h1>
                <p>Based on your viewing history and preferences</p>
            </header>

            {recommendations.length > 0 && (
                <section className="recs-section">
                    <div className="section-title">
                        <h2>Picked For You</h2>
                        <div className="title-underline"></div>
                    </div>
                    <div className="movies-grid">
                        {recommendations.map(movie => (
                            <MovieCard
                                key={movie.movieId || movie.id}
                                movie={movie}
                                onToggleWatchlist={onToggleWatchlist}
                                isInWatchlist={watchlistIds.includes(movie.movieId || movie.id)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {recommendations.length === 0 && !loading && !error && (
                <section className="cold-start-section">
                    <div className="no-recs-notice">
                        <p>You haven't rated enough movies yet for personalized recommendations.</p>
                        <p>Start rating movies to get better picks!</p>
                    </div>
                </section>
            )}

            {trendingMovies.length > 0 && (
                <section className="trending-section">
                    <div className="section-title">
                        <h2>Trending Now</h2>
                        <div className="title-underline"></div>
                    </div>
                    <div className="movies-grid">
                        {trendingMovies.map(movie => (
                            <MovieCard
                                key={movie.movieId || movie.id}
                                movie={movie}
                                onToggleWatchlist={onToggleWatchlist}
                                isInWatchlist={watchlistIds.includes(movie.movieId || movie.id)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {mostRated.length > 0 && (
                <section className="recs-section">
                    <div className="section-title">
                        <h2>Most Rated by Users</h2>
                        <div className="title-underline"></div>
                    </div>
                    <div className="movies-grid">
                        {mostRated.map(movie => (
                            <MovieCard
                                key={movie.movieId || movie.id}
                                movie={movie}
                                onToggleWatchlist={onToggleWatchlist}
                                isInWatchlist={watchlistIds.includes(movie.movieId || movie.id)}
                            />
                        ))}
                    </div>
                </section>
            )}

            {mostViewed.length > 0 && (
                <section className="recs-section">
                    <div className="section-title">
                        <h2>Most Searched</h2>
                        <div className="title-underline"></div>
                    </div>
                    <div className="movies-grid">
                        {mostViewed.map(movie => (
                            <MovieCard
                                key={movie.movieId || movie.id}
                                movie={movie}
                                onToggleWatchlist={onToggleWatchlist}
                                isInWatchlist={watchlistIds.includes(movie.movieId || movie.id)}
                            />
                        ))}
                    </div>
                </section>
            )}


            {hasNoContent && !loading && (
                <div className="empty-state">
                    <p>We couldn't find any movies for you right now.</p>
                    <p>Please check back later or try exploring genres!</p>
                </div>
            )}

            <footer className="recs-footer">
                <p>Showing {recommendations.length + trendingMovies.length + mostRated.length + mostViewed.length} recommendations for {user?.username}</p>
            </footer>
        </div>
    );
};

export default Recommendations;
