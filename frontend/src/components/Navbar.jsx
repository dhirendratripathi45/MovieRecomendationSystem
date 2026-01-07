import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ onSearch, user, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      setShowUserDropdown(false);
      navigate('/login');
    }
  };

  const menuItems = [
    { name: 'Home', path: '/' },
    { name: 'Recommendations', path: '/recommendations' },
    { name: 'Trending', path: '/trending' },
    { name: 'Genres', path: '/genres' },
    { name: 'My Watchlist', path: '/watchlist' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <Link to="/" className="logo-link">
            <span className="logo-icon">🎬</span>
            <span className="logo-text">MovieRec</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="navbar-search">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search movies, actors, genres..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              <span className="search-icon">🔍</span>
            </button>
          </form>
        </div>

        {/* Desktop Menu */}
        <div className="navbar-menu">
          <ul className="menu-list">
            {menuItems.map((item) => (
              <li key={item.name} className="menu-item">
                <Link to={item.path} className="menu-link">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* User Section */}
        <div className="navbar-user">
          {user ? (
            <div 
              className="user-profile-container"
              onMouseEnter={() => setShowUserDropdown(true)}
              onMouseLeave={() => setShowUserDropdown(false)}
            >
              <div className="user-profile">
                <img 
                  src={user.profile_picture || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
                  alt={user.username}
                  className="user-avatar"
                />
                <span className="user-name">{user.username || user.first_name}</span>
                <span className="dropdown-arrow">▼</span>
              </div>
              
              {/* User Dropdown Menu */}
              {showUserDropdown && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <img 
                      src={user.profile_picture || `https://ui-avatars.com/api/?name=${user.username}&background=random`} 
                      alt={user.username}
                      className="dropdown-avatar"
                    />
                    <div className="dropdown-user-info">
                      <h4>{user.username}</h4>
                      <p>{user.email}</p>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/profile" className="dropdown-item">
                    <span className="dropdown-icon">👤</span>
                    My Profile
                  </Link>
                  <Link to="/watchlist" className="dropdown-item">
                    <span className="dropdown-icon">📽️</span>
                    My Watchlist
                  </Link>
                  <Link to="/settings" className="dropdown-item">
                    <span className="dropdown-icon">⚙️</span>
                    Settings
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <span className="dropdown-icon">🚪</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-login">
                <span className="btn-icon">🔑</span>
                Sign In
              </Link>
              <Link to="/register" className="btn-signup">
                <span className="btn-icon">👤</span>
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className={`mobile-menu-button ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="mobile-menu">
          <ul className="mobile-menu-list">
            {menuItems.map((item) => (
              <li key={item.name} className="mobile-menu-item">
                <Link 
                  to={item.path} 
                  className="mobile-menu-link"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              </li>
            ))}
            
            {/* Mobile Auth Buttons */}
            {!user ? (
              <>
                <li className="mobile-menu-item">
                  <Link 
                    to="/login" 
                    className="mobile-menu-link auth-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="mobile-auth-icon">🔑</span>
                    Sign In
                  </Link>
                </li>
                <li className="mobile-menu-item">
                  <Link 
                    to="/register" 
                    className="mobile-menu-link auth-link signup"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="mobile-auth-icon">👤</span>
                    Sign Up
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li className="mobile-menu-item">
                  <Link 
                    to="/profile" 
                    className="mobile-menu-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className="mobile-auth-icon">👤</span>
                    My Profile
                  </Link>
                </li>
                <li className="mobile-menu-item">
                  <button 
                    onClick={handleLogout}
                    className="mobile-menu-link logout-btn"
                  >
                    <span className="mobile-auth-icon">🚪</span>
                    Logout
                  </button>
                </li>
              </>
            )}
            
            <li className="mobile-menu-search">
              <form onSubmit={handleSearch} className="mobile-search-form">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mobile-search-input"
                />
                <button type="submit" className="mobile-search-button">
                  🔍
                </button>
              </form>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;