import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import { watchlistAPI } from './utils/api';

// Lazy load components
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const MovieDetail = lazy(() => import('./pages/MovieDetail'));
const Profile = lazy(() => import('./pages/Profile'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const Trending = lazy(() => import('./pages/Trending'));
const Genres = lazy(() => import('./pages/Genres'));
const RatedMovies = lazy(() => import('./pages/RatedMovies'));
const Settings = lazy(() => import('./pages/Settings'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const ManageMovies = lazy(() => import('./pages/admin/ManageMovies'));
const AddMovie = lazy(() => import('./pages/admin/AddMovie'));
const EditMovie = lazy(() => import('./pages/admin/EditMovie'));
const ManageUsers = lazy(() => import('./pages/admin/ManageUsers'));
const Search = lazy(() => import('./pages/Search'));

const PageLoader = () => (
  <div className="loading-screen">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchlistIds, setWatchlistIds] = useState([]);

  useEffect(() => {
    // Clear old persistent localStorage to prevent auto-login
    if (localStorage.getItem('user')) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }

    // Check if user is logged in
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchWatchlist(); // Fetch watchlist on load
    }
    setLoading(false);
  }, []);

  const fetchWatchlist = async () => {
    try {
      const res = await watchlistAPI.get();
      setWatchlistIds(res.data.map(m => m.movieId));
    } catch (e) { console.error("WL Error", e); }
  };

  const handleToggleWatchlist = async (movie) => {
    const movieId = movie.movieId || movie.id;
    const isAdded = watchlistIds.includes(movieId);
    try {
      if (isAdded) {
        await watchlistAPI.remove(movieId);
        setWatchlistIds(prev => prev.filter(id => id !== movieId));
      } else {
        await watchlistAPI.add({
          movieId: movieId,
          title: movie.title,
          genres: movie.genres_list ? (Array.isArray(movie.genres_list) ? movie.genres_list.join('|') : movie.genres_list) : '',
          tmdbId: movie.tmdb_id
        });
        setWatchlistIds(prev => [...prev, movieId]);
      }
    } catch (err) {
      console.error("Watchlist toggle failed", err);
    }
  };

  const handleLogin = (userData, token) => {
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('token', token);
    fetchWatchlist();
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
  };

  const handleSearch = (query) => {
    console.log('Searching for:', query);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        {user && <Navbar onSearch={handleSearch} user={user} onLogout={handleLogout} />}
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route
              path="/login"
              element={
                user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'} /> : <Login onLogin={handleLogin} />
              }
            />
            <Route
              path="/register"
              element={
                user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'} /> : <Register onLogin={handleLogin} />
              }
            />
            <Route
              path="/"
              element={
                user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Home user={user} watchlistIds={watchlistIds} onToggleWatchlist={handleToggleWatchlist} />) : <Navigate to="/register" />
              }
            />
            <Route
              path="/recommendations"
              element={
                user ? <Recommendations user={user} watchlistIds={watchlistIds} onToggleWatchlist={handleToggleWatchlist} /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/watchlist"
              element={
                user ? <Watchlist user={user} watchlistIds={watchlistIds} onToggleWatchlist={handleToggleWatchlist} /> : <Navigate to="/login" />
              }
            />


            <Route
              path="/admin"
              element={
                user?.role === 'admin' ? <AdminLayout /> : <Navigate to="/" />
              }
            >
              <Route index element={<AdminOverview />} />
              <Route path="movies" element={<ManageMovies />} />
              <Route path="add-movie" element={<AddMovie />} />
              <Route path="edit-movie/:id" element={<EditMovie />} />
              <Route path="users" element={<ManageUsers />} />
            </Route>
            <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/login" />} />
            <Route path="/trending" element={user ? <Trending user={user} watchlistIds={watchlistIds} onToggleWatchlist={handleToggleWatchlist} /> : <Navigate to="/login" />} />
            <Route path="/genres" element={user ? <Genres user={user} watchlistIds={watchlistIds} onToggleWatchlist={handleToggleWatchlist} /> : <Navigate to="/login" />} />
            <Route path="/rated" element={user ? <RatedMovies user={user} /> : <Navigate to="/login" />} />
            <Route path="/search" element={user ? <Search watchlistIds={watchlistIds} onToggleWatchlist={handleToggleWatchlist} /> : <Navigate to="/login" />} />
            <Route path="/viewall" element={user ? <Search watchlistIds={watchlistIds} onToggleWatchlist={handleToggleWatchlist} /> : <Navigate to="/login" />} />
            <Route path="/settings" element={user ? <Settings user={user} /> : <Navigate to="/login" />} />
            <Route path="/movie/:id" element={user ? <MovieDetail user={user} watchlistIds={watchlistIds} onToggleWatchlist={handleToggleWatchlist} /> : <Navigate to="/login" />} />
          </Routes>
        </Suspense>
      </div>
    </Router>

  );
}

export default App;