import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../utils/api';
import './AdminOverview.css';

const AdminOverview = () => {
    const [stats, setStats] = useState({
        users: 0,
        movies: 0,
        reviews: 0,
        watchlist_count: 0,
        views: 0,
        highest_rated: '...',
        top_viewed: '...',
        most_watchlisted: '...'
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, activityRes] = await Promise.all([
                    adminAPI.getStats(),
                    adminAPI.getActivity()
                ]);
                setStats(statsRes.data);
                setRecentActivity(activityRes.data);
            } catch (err) {
                console.error("Dashboard error", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="admin-loading">Loading Dashboard...</div>;

    return (
        <div className="admin-overview">
            <header className="page-header">
                <h1>Dashboard Overview</h1>
                <p>Monitor your movie ecosystem performance</p>
            </header>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <h3>Total Users</h3>
                        <p>{stats.users}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🎬</div>
                    <div className="stat-info">
                        <h3>Total Movies</h3>
                        <p>{stats.movies}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-info">
                        <h3>Total Ratings</h3>
                        <p>{stats.reviews || 0}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📑</div>
                    <div className="stat-info">
                        <h3>Total Watchlist</h3>
                        <p>{stats.watchlist_count || 0}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">👁️</div>
                    <div className="stat-info">
                        <h3>Total Views</h3>
                        <p>{stats.views}</p>
                    </div>
                </div>
            </div>

            <div className="stats-grid extra-stats">
                <div className="stat-card highlight">
                    <div className="stat-icon">📌</div>
                    <div className="stat-info">
                        <h3>Most Watchlisted</h3>
                        <p>{stats.most_watchlisted}</p>
                    </div>
                </div>
            </div>

            <div className="admin-lists-grid">
                <div className="admin-list-card">
                    <h3>🔥 Trending Movies</h3>
                    <ul>
                        {stats.trending && stats.trending.map((m, i) => (
                            <li key={i}>
                                <span className="list-rank">#{i + 1}</span>
                                <span className="list-title">{m.title}</span>
                                <span className="list-metric">{m.watchlist_count || 0} adds</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="admin-list-card">
                    <h3>👁️ Most Viewed</h3>
                    <ul>
                        {stats.top_viewed && stats.top_viewed.map((m, i) => (
                            <li key={i}>
                                <span className="list-rank">#{i + 1}</span>
                                <span className="list-title">{m.title}</span>
                                <span className="list-metric">{m.view_count} views</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="admin-list-card">
                    <h3>⭐ Highest Rated</h3>
                    <ul>
                        {stats.highest_rated && stats.highest_rated.map((m, i) => (
                            <li key={i}>
                                <span className="list-rank">#{i + 1}</span>
                                <span className="list-title">{m.title}</span>
                                <span className="list-metric">{m.vote_average}/10</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="admin-list-card">
                    <h3>💬 Most Rated (Mosted)</h3>
                    <ul>
                        {stats.most_rated && stats.most_rated.map((m, i) => (
                            <li key={i}>
                                <span className="list-rank">#{i + 1}</span>
                                <span className="list-title">{m.title}</span>
                                <span className="list-metric">{m.vote_count} votes</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="activity-section">
                <h2>Recent Activity</h2>
                <div className="activity-list">
                    {recentActivity.length > 0 ? (
                        recentActivity.map(activity => (
                            <div key={activity.id} className="activity-item">
                                <span className="activity-icon">{activity.icon || '🔔'}</span>
                                <div className="activity-content">
                                    <p className="activity-text">{activity.text}</p>
                                    <small className="activity-time">{activity.time}</small>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="empty-msg">No recent activity detected.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;
