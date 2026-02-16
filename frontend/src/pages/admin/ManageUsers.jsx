import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import './ManageUsers.css';

const ManageUsers = () => {
    const [searchParams] = useSearchParams();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

    useEffect(() => {
        const query = searchParams.get('search') || '';
        setSearchTerm(query);
    }, [searchParams]);

    useEffect(() => {
        fetchUsers();
    }, [searchTerm]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await adminAPI.getUsers(searchTerm);
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (userId) => {
        setDetailsLoading(true);
        setSelectedUser(userId);
        try {
            const res = await adminAPI.getUserDetails(userId);
            setUserDetails(res.data);
        } catch (err) {
            console.error("Error fetching user details", err);
            alert("Could not load user details");
        } finally {
            setDetailsLoading(false);
        }
    };

    return (
        <div className="manage-users">
            <header className="page-header">
                <h1>Manage Users</h1>
                <p>View and manage all registered accounts</p>
            </header>

            <div className="table-container">
                {loading ? <div className="loading-overlay">Loading users...</div> : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Avatar</th>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-avatar-small">
                                            {user.username[0].toUpperCase()}
                                        </div>
                                    </td>
                                    <td><strong>{user.username}</strong></td>
                                    <td>{user.email}</td>
                                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td>
                                        <button
                                            className="btn-secondary btn-small"
                                            onClick={() => handleViewDetails(user.id)}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedUser && (
                <div className="user-details-modal-overlay" onClick={() => setSelectedUser(null)}>
                    <div className="user-details-modal" onClick={e => e.stopPropagation()}>
                        <header className="modal-header">
                            <h2>User Details</h2>
                            <button className="close-btn" onClick={() => setSelectedUser(null)}>×</button>
                        </header>

                        {detailsLoading ? <div className="loading-msg">Loading user info...</div> : (
                            userDetails && (
                                <div className="modal-content">
                                    <div className="user-info-header">
                                        <div className="user-avatar-large">
                                            {userDetails.username[0].toUpperCase()}
                                        </div>
                                        <div className="user-meta">
                                            <h3>{userDetails.username}</h3>
                                            <p>{userDetails.email}</p>
                                            <span className="status-tag active">Active</span>
                                        </div>
                                    </div>

                                    <div className="user-stats-row">
                                        <div className="user-stat">
                                            <label>Watchlist</label>
                                            <span>{userDetails.watchlist?.length || 0} movies</span>
                                        </div>
                                        <div className="user-stat">
                                            <label>Ratings</label>
                                            <span>{userDetails.ratings_count || 0} reviews</span>
                                        </div>
                                        <div className="user-stat">
                                            <label>Joined</label>
                                            <span>{new Date(userDetails.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="user-watchlist-preview">
                                        <h4>Watchlist Preview</h4>
                                        <div className="watchlist-list">
                                            {userDetails.watchlist?.length > 0 ? (
                                                userDetails.watchlist.slice(0, 5).map(w => (
                                                    <div key={w.id} className="watchlist-item-mini">
                                                        🎬 {w.title}
                                                    </div>
                                                ))
                                            ) : <p className="empty-msg">No movies in watchlist</p>}
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageUsers;
