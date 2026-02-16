import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MovieDetail from './pages/MovieDetail';
import Profile from './pages/Profile';
import Recommendations from './pages/Recommendations';
import Watchlist from './pages/Watchlist';
import Trending from './pages/Trending';
import Genres from './pages/Genres';
import RatedMovies from './pages/RatedMovies';
import Settings from './pages/Settings';
import AdminLayout from './pages/admin/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import ManageMovies from './pages/admin/ManageMovies';
import AddMovie from './pages/admin/AddMovie';
import EditMovie from './pages/admin/EditMovie';
import ManageUsers from './pages/admin/ManageUsers';
import Search from './pages/Search';
import { watchlistAPI } from './utils/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchlistIds, setWatchlistIds] = useState([]);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
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
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    fetchWatchlist();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
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
              user ? (user.role === 'admin' ? <Navigate to="/admin" /> : <Home user={user} watchlistIds={watchlistIds} onToggleWatchlist={handleToggleWatchlist} />) : <Navigate to="/login" />
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
          <Route path="/trending" element={user ? <Trending watchlistIds={watchlistIds} onToggleWatchlist={handleToggleWatchlist} /> : <Navigate to="/login" />} />
          <Route path="/genres" element={user ? <Genres watchlistIds={watchlistIds} onToggleWatchlist={handleToggleWatchlist} /> : <Navigate to="/login" />} />
          <Route path="/rated" element={user ? <RatedMovies user={user} /> : <Navigate to="/login" />} />
          <Route path="/search" element={user ? <Search watchlistIds={watchlistIds} onToggleWatchlist={handleToggleWatchlist} /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <Settings user={user} /> : <Navigate to="/login" />} />
          <Route path="/movie/:id" element={user ? <MovieDetail user={user} watchlistIds={watchlistIds} onToggleWatchlist={handleToggleWatchlist} /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>

  );
}

export default App;