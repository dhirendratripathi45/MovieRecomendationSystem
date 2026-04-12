import { useState } from 'react';
import { authAPI } from '../utils/api';
import './admin/AdminSettings.css'; // Reuse existing styles

const Settings = ({ user }) => {
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [profilePicture, setProfilePicture] = useState(user?.profile_picture || '');
    const [message, setMessage] = useState('');

    // Password change state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            await authAPI.updateProfile({ username, email, profile_picture: profilePicture });
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Error updating profile: ' + (err.response?.data?.message || err.message));
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        try {
            await authAPI.changePassword({ current_password: currentPassword, new_password: newPassword });
            setMessage('Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setMessage('Error changing password: ' + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className="admin-settings" style={{ padding: '2rem' }}>
            <header className="page-header">
                <h1>Settings</h1>
                <p>Manage your account {user?.role === 'admin' && 'and system'} preferences</p>
            </header>

            <div className="settings-grid">
                <section className="settings-section">
                    <h2>Profile Settings</h2>
                    <form onSubmit={handleProfileUpdate} className="settings-form">
                        <div className="settings-group">
                            <label>Profile Picture URL</label>
                            <input
                                type="text"
                                value={profilePicture}
                                onChange={(e) => setProfilePicture(e.target.value)}
                                placeholder="https://example.com/avatar.jpg"
                                className="admin-input"
                                style={{ width: '100%', marginBottom: '10px' }}
                            />
                            {profilePicture && <img src={profilePicture} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />}
                        </div>

                        <div className="settings-group">
                            <label>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="admin-input"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="settings-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="admin-input"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <button type="submit" className="btn-primary">
                            Save Profile
                        </button>
                    </form>
                </section>

                <section className="settings-section">
                    <h2>Security</h2>
                    <form onSubmit={handlePasswordChange} className="settings-form">
                        <div className="settings-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="admin-input"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div className="settings-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="admin-input"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <button type="submit" className="btn-secondary">
                            Change Password
                        </button>
                    </form>
                </section>


            </div>

            {message && <div style={{ position: 'fixed', bottom: '20px', right: '20px', backgroundColor: '#e50914', color: 'white', padding: '1rem', borderRadius: '8px', zIndex: 1000, boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>{message}</div>}
        </div>
    );
};

export default Settings;
