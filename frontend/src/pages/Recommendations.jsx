import { useState, useEffect, useRef } from 'react';
import './Recommendations.css';
import { recommendationAPI } from '../utils/api';
import MovieCard from '../components/MovieCard';

const LazyRecSection = ({ title, fetchFn, user, watchlistIds, onToggleWatchlist, limit }) => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;
        const load = async () => {
            setLoading(true);
            try {
                const res = await fetchFn();
                let data = Array.isArray(res.data) ? res.data : (res.data?.movies || []);

                if (limit) data = data.slice(0, limit);
                setMovies(data);
            } catch (err) {
                console.error(`Error loading ${title}:`, err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [isVisible, fetchFn, title, limit, user]);

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    if (!isVisible && !loading && movies.length === 0) {
        return <section ref={sectionRef} style={{ height: '400px', margin: '2rem 0' }}></section>;
    }

    if (movies.length === 0 && !loading) return null;

    return (
        <section className="recs-section" ref={sectionRef}>
            <div className="section-header">
                <div className="section-title">
                    <h2>{title}</h2>
                    <div className="title-underline"></div>
                </div>
                <div className="scroll-controls">
                    <button className="scroll-btn prev" onClick={() => scroll('left')}>‹</button>
                    <button className="scroll-btn next" onClick={() => scroll('right')}>›</button>
                </div>
            </div>
            <div className="movies-row-container">
                <div className="movies-row-scroll" ref={scrollRef}>
                    {loading ? (
                        Array(limit || 10).fill(0).map((_, i) => (
                            <div key={i} className="skeleton-card" style={{ flex: '0 0 240px', height: '360px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px' }}></div>
                        ))
                    ) : (
                        movies.map(movie => (
                            <div key={movie.movieId || movie.id} className="movie-row-item">
                                <MovieCard
                                    movie={movie}
                                    onToggleWatchlist={onToggleWatchlist}
                                    isInWatchlist={watchlistIds.includes(movie.movieId || movie.id)}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
};

const Recommendations = ({ user, watchlistIds, onToggleWatchlist }) => {
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    useEffect(() => {
        // Just a small delay to handle the page transition smoothly
        const timer = setTimeout(() => setIsInitialLoad(false), 500);
        return () => clearTimeout(timer);
    }, []);

    if (!user) {
        return (
            <div className="error-screen">
                <div className="error-icon">👤</div>
                <p>Please login to see personalized recommendations.</p>
            </div>
        );
    }

    const preferredGenres = user?.preferences?.preferred_genres || [];

    return (
        <div className="recommendations-page">
            <header className="page-header">
                <h1>Your <span className="highlight">Recommendations</span></h1>
                <p>Based on your viewing history and preferences</p>
            </header>

            <LazyRecSection
                title="Picked For You"
                fetchFn={() => recommendationAPI.getHybrid(user.id)}
                user={user}
                watchlistIds={watchlistIds}
                onToggleWatchlist={onToggleWatchlist}
            />

            <LazyRecSection
                title="Similar Viewers Liked"
                fetchFn={() => recommendationAPI.getCollaborative(user.id)}
                user={user}
                watchlistIds={watchlistIds}
                onToggleWatchlist={onToggleWatchlist}
            />

            {preferredGenres.map(genre => (
                <LazyRecSection
                    key={genre}
                    title={`Because you like ${genre}`}
                    fetchFn={() => recommendationAPI.getAll(1, 20, genre, '', '', true)}
                    user={user}
                    watchlistIds={watchlistIds}
                    onToggleWatchlist={onToggleWatchlist}
                    limit={20}
                />
            ))}

            <LazyRecSection
                title="Trending"
                fetchFn={() => recommendationAPI.getTrending()}
                user={user}
                watchlistIds={watchlistIds}
                onToggleWatchlist={onToggleWatchlist}
                limit={15}
            />

            <LazyRecSection
                title="Popular in Watchlists"
                fetchFn={() => recommendationAPI.getPopularWatchlists()}
                user={user}
                watchlistIds={watchlistIds}
                onToggleWatchlist={onToggleWatchlist}
                limit={15}
            />

            <LazyRecSection
                title="Most Rated by Users"
                fetchFn={() => recommendationAPI.getMostRated()}
                user={user}
                watchlistIds={watchlistIds}
                onToggleWatchlist={onToggleWatchlist}
            />



            <footer className="recs-footer">
                <p>Personalized collection for {user?.username}</p>
            </footer>
        </div>
    );
};

export default Recommendations;
