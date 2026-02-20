import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { recommendationAPI } from '../utils/api';
import './Navbar.css';

const Navbar = ({ onSearch, user, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showGenreMenu, setShowGenreMenu] = useState(false);
  const [mobileGenreOpen, setMobileGenreOpen] = useState(false);
  const [genres, setGenres] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await recommendationAPI.getGenres();
        let genreData = response.data;

        // Filter genres based on user preferences if they exist
        const preferredGenres = user?.preferences?.preferred_genres || [];
        if (preferredGenres.length > 0) {
          genreData = genreData.filter(g => preferredGenres.includes(g.name));
        }

        setGenres(genreData);
      } catch (error) {
        console.error('Failed to fetch genres:', error);
      }
    };
    fetchGenres();
  }, [user]);

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
      setShowUserDropdown(false);
      navigate('/register');
    }
  };

  const handleGenreClick = (genreName) => {
    navigate(`/search?genre=${encodeURIComponent(genreName)}`);
    setShowGenreMenu(false);
    setIsMenuOpen(false);
  };

  let menuItems = [];

  if (user && user.role === 'admin') {
    menuItems = [
      { name: 'Dashboard', path: '/admin' },
      { name: 'Manage Movies', path: '/admin/movies' },
      { name: 'Add Movie', path: '/admin/add-movie' },
      { name: 'Manage Users', path: '/admin/users' },
      { name: 'Settings', path: '/settings' },
    ];
  } else {
    menuItems = [
      { name: 'Home', path: '/' },
      { name: 'Recommendations', path: '/recommendations' },
    ];
  }

  const getSearchPlaceholder = () => {
    if (user?.role === 'admin') {
      const path = location.pathname;
      if (path.includes('/admin/users')) return "Search users by name or email...";
      if (path.includes('/admin/movies')) return "Search movies to manage...";
      return "Search users, movies...";
    }
    return "Search movies, actors, genres...";
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (user?.role === 'admin') {
      const path = location.pathname;
      if (path.includes('/admin/users')) {
        navigate(`/admin/users?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        // Default to movie search in admin context
        navigate(`/admin/movies?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
    setSearchQuery('');
  };

  const chunkArray = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <Link to="/" className="logo-link">
            <span className="logo-text">MovieRec</span>
          </Link>
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
            {!user || user.role !== 'admin' ? (
              <>
                <li
                  className="menu-item mega-menu-container"
                  onMouseEnter={() => setShowGenreMenu(true)}
                  onMouseLeave={() => setShowGenreMenu(false)}
                >
                  <span className="menu-link">Genre ▼</span>
                  {showGenreMenu && (
                    <div className="mega-menu">
                      {chunkArray(genres, Math.ceil(genres.length / 4)).map((column, idx) => (
                        <div key={idx} className="mega-menu-column">
                          {column.map((genre) => (
                            <Link
                              key={genre.id}
                              to={`/search?genre=${encodeURIComponent(genre.name)}`}
                              className="mega-menu-item"
                              onClick={() => setShowGenreMenu(false)}
                            >
                              {genre.name}
                            </Link>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              </>
            ) : null}
          </ul>
        </div>

        {/* Search Bar */}
        <div className="navbar-search">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder={getSearchPlaceholder()}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <button type="submit" className="search-button">
              <span className="search-icon">🔍</span>
            </button>
          </form>
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
                  {user.role !== 'admin' && (
                    <>
                      <Link to="/profile" className="dropdown-item">
                        <span className="dropdown-icon">👤</span>
                        My Profile
                      </Link>
                      <Link to="/trending" className="dropdown-item">
                        <span className="dropdown-icon">📈</span>
                        Trending
                      </Link>
                      <Link to="/genres" className="dropdown-item">
                        <span className="dropdown-icon">🎭</span>
                        Genres
                      </Link>
                      <Link to="/watchlist" className="dropdown-item">
                        <span className="dropdown-icon">📽️</span>
                        My Watchlist
                      </Link>
                      <Link to="/rated" className="dropdown-item">
                        <span className="dropdown-icon">⭐</span>
                        My Ratings
                      </Link>
                    </>
                  )}
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
      {
        isMenuOpen && (
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

              {!user || user.role !== 'admin' ? (
                <>
                  <li className="mobile-menu-item">
                    <div className="mobile-menu-link" onClick={() => setMobileGenreOpen(!mobileGenreOpen)}>
                      Genre {mobileGenreOpen ? '▲' : '▼'}
                    </div>
                    {mobileGenreOpen && (
                      <div className="mobile-mega-menu">
                        {genres.map((genre) => (
                          <Link
                            key={genre.id}
                            to={`/search?genre=${encodeURIComponent(genre.name)}`}
                            className="mobile-mega-item"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {genre.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </li>
                </>
              ) : null}

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
          </div >
        )}
    </nav >
  );
};

export default Navbar;