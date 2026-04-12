import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, recommendationAPI } from '../utils/api';
import './Login.css';

const Register = ({ onLogin }) => {  // Add onLogin prop
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [availableGenres, setAvailableGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await recommendationAPI.getGenres();
        setAvailableGenres(response.data);
      } catch (error) {
        console.error('Failed to fetch genres:', error);
      }
    };
    fetchGenres();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (selectedGenres.length === 0) {
      newErrors.genres = 'Please select at least one genre';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    setRegisterError('');
  };

  const toggleGenre = (genreId) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter(id => id !== genreId));
    } else {
      setSelectedGenres([...selectedGenres, genreId]);
    }
    if (errors.genres) {
      setErrors({ ...errors, genres: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setRegisterError('');

    try {
      // Register the user
      const response = await authAPI.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        genres: selectedGenres
      });

      const { user, token } = response.data;

      // Redirect to login page
      navigate('/login');

    } catch (error) {
      setRegisterError(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="login-card" style={{ width: '100%', maxWidth: '500px', flex: 'none' }}>
        <div className="login-header">
          <div className="logo">
            <span className="logo-icon">🌐</span>
            <span className="logo-text">MovieRec</span>
          </div>
          <h1>Create Account</h1>
          <p>Join our movie community</p>
        </div>

        {registerError && (
          <div className="error-message">
            ⚠️ {registerError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={errors.username ? 'input-error' : ''}
              placeholder="Choose a username"
              autoComplete="username"
            />
            {errors.username && <span className="error-text">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'input-error' : ''}
              placeholder="Enter your email"
              autoComplete="email"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'input-error' : ''}
              placeholder="Create a password"
              autoComplete="new-password"
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'input-error' : ''}
              placeholder="Confirm your password"
              autoComplete="new-password"
            />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>

          <div className="genre-selection-container">
            <h3>Select Your Favorite Genres</h3>
            <div className="genre-grid">
              {availableGenres.map((genre) => (
                <div
                  key={genre.id}
                  className={`genre-item ${selectedGenres.includes(genre.name) ? 'selected' : ''}`}
                  onClick={() => toggleGenre(genre.name)}
                >
                  {genre.name}
                </div>
              ))}
            </div>
            {errors.genres && <span className="error-text">{errors.genres}</span>}
          </div>



          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Creating Account...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <div className="signup-link">
          Already have an account? <Link to="/login">Login here</Link>
        </div>
      </div >
    </div>
  );
};

export default Register;