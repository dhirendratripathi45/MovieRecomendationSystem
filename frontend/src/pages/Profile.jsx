import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI, watchlistAPI } from "../utils/api";
import MovieCard from "../components/MovieCard";
import "./Profile.css";

const Profile = ({ user }) => {
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState(null);
    const [watchlistIds, setWatchlistIds] = useState([]);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await authAPI.getProfile();
                setProfileData(res.data);

                const wlRes = await watchlistAPI.get();
                setWatchlistIds(wlRes.data.map(m => m.movieId));
            } catch (e) {
                console.error(e);
            }
        };
        fetchProfile();
    }, []);

    const toggleWatchlist = async (movie) => {
        const id = movie.movieId || movie.id;
        try {
            if (watchlistIds.includes(id)) {
                await watchlistAPI.remove(id);
                setWatchlistIds(prev => prev.filter(mid => mid !== id));
            } else {
                await watchlistAPI.add({
                    movieId: id,
                    title: movie.title,
                    genres: movie.genres,
                    tmdbId: movie.tmdbId
                });
                setWatchlistIds(prev => [...prev, id]);
            }
        } catch (err) { console.error(err); }
    };

    const userData = profileData || user;
    const ratedCount = userData?.rated_movies?.length || 0;

    return (
        <div className="profile-page">
            <div className="profile-container-glass">
                <div className="profile-header-card">
                    <div className="profile-avatar-wrapper">
                        <img
                            src={userData?.profile_picture || `https://placehold.co/180x180?text=${userData?.username?.[0] || 'U'}`}
                            alt="Profile"
                            className="profile-avatar"
                        />
                    </div>
                    <div className="profile-info-main">
                        <span className="username-tag">@{userData?.username}</span>
                        <h1>{userData?.first_name} {userData?.last_name}</h1>
                        <p className="email-text">{userData?.email}</p>

                        <div className="profile-stats">
                            <div className="stat-item">
                                <span className="stat-value">{ratedCount}</span>
                                <span className="stat-label">Ratings</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">0</span>
                                <span className="stat-label">Followers</span>
                            </div>
                        </div>

                        <div className="profile-actions">
                            <button onClick={() => navigate('/settings')} className="edit-btn">Edit Profile</button>
                            {userData?.role === 'admin' && (
                                <button onClick={() => navigate('/admin')} className="admin-btn" style={{ marginLeft: '1rem', background: '#e50914', color: 'white' }}>Admin</button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Rated Movies Section */}
                {ratedCount > 0 && (
                    <div className="rated-movies-section">
                        <h2>My Ratings</h2>
                        <div className="movies-grid">
                            {userData.rated_movies.map(movie => (
                                <MovieCard
                                    key={movie.movie_id || movie.id}
                                    movie={movie}
                                    onToggleWatchlist={toggleWatchlist}
                                    isInWatchlist={watchlistIds.includes(movie.movie_id || movie.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
