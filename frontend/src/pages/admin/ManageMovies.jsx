import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../utils/api';
import './ManageMovies.css';

const ManageMovies = () => {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        is_trending: false,
        is_arriving_soon: false,
        sort_by: 'newest'
    });
    const navigate = useNavigate();

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchMovies();
        }, 500); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [page, searchTerm, filters]);

    const fetchMovies = async () => {
        setLoading(true);
        try {
            // Convert boolean filters to strings 'true'/'false' if checked, else undefined to ignore
            const apiFilters = {
                sort_by: filters.sort_by,
                is_trending: filters.is_trending ? 'true' : undefined,
                is_arriving_soon: filters.is_arriving_soon ? 'true' : undefined
            };

            const res = await adminAPI.getMovies(page, searchTerm, apiFilters);
            setMovies(res.data.movies);
            setTotalPages(res.data.pages);
        } catch (err) {
            console.error("Fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this movie? This action cannot be undone.')) return;
        try {
            await adminAPI.deleteMovie(id);
            fetchMovies();
        } catch (err) {
            alert('Error deleting movie');
        }
    };

    const handleEdit = (id) => {
        navigate(`/admin/edit-movie/${id}`);
    };

    const handleToggleTrending = async (movie) => {
        try {
            await adminAPI.updateMovie(movie.id, { is_trending: !movie.is_trending });
            setMovies(prev => prev.map(m =>
                m.id === movie.id ? { ...m, is_trending: !m.is_trending } : m
            ));
        } catch (err) {
            alert('Error updating trending status');
        }
    };

    const handleToggleArrivingSoon = async (movie) => {
        try {
            await adminAPI.updateMovie(movie.id, { is_arriving_soon: !movie.is_arriving_soon });
            setMovies(prev => prev.map(m =>
                m.id === movie.id ? { ...m, is_arriving_soon: !m.is_arriving_soon } : m
            ));
        } catch (err) {
            alert('Error updating arriving soon status');
        }
    };

    return (
        <div className="manage-movies">
            <header className="manager-header">
                <div>
                    <h1>Manage Movies</h1>
                    <p>Edit, delete, or promote movies to trending</p>
                </div>
            </header>

            <div className="controls-bar">
                <input
                    type="text"
                    placeholder="Search movies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />

                <div className="filters">
                    <select
                        value={filters.sort_by}
                        onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
                        className="sort-select"
                    >
                        <option value="newest">Newest Added</option>
                        <option value="oldest">Oldest Added</option>
                        <option value="title">Title (A-Z)</option>
                        <option value="year">Release Year</option>
                    </select>

                    <label className="filter-checkbox">
                        <input
                            type="checkbox"
                            checked={filters.is_trending}
                            onChange={(e) => setFilters({ ...filters, is_trending: e.target.checked })}
                        />
                        Trending
                    </label>

                    <label className="filter-checkbox">
                        <input
                            type="checkbox"
                            checked={filters.is_arriving_soon}
                            onChange={(e) => setFilters({ ...filters, is_arriving_soon: e.target.checked })}
                        />
                        Arriving Soon
                    </label>
                </div>
            </div>

            <div className="table-container">
                {loading ? <div className="loading-overlay">Updating...</div> : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Poster</th>
                                <th>Title</th>
                                <th>Year</th>
                                <th>Status</th>
                                <th>Trending</th>
                                <th>Arriving Soon</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movies.map(movie => (
                                <tr key={movie.id}>
                                    <td>
                                        <img
                                            src={movie.poster_path ? (
                                                movie.poster_path.startsWith('http') ? movie.poster_path :
                                                    movie.poster_path.startsWith('/static') ? `http://localhost:5000${movie.poster_path}` :
                                                        `https://image.tmdb.org/t/p/w92${movie.poster_path}`
                                            ) : `https://placehold.co/40x60?text=🎬`}
                                            alt={movie.title}
                                            className="table-thumb"
                                        />
                                    </td>
                                    <td className="movie-title-cell">
                                        <strong>{movie.title}</strong>
                                    </td>
                                    <td>{movie.release_year}</td>
                                    <td><span className="status-tag live">Live</span></td>
                                    <td>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={movie.is_trending}
                                                onChange={() => handleToggleTrending(movie)}
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                    </td>
                                    <td>
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={movie.is_arriving_soon}
                                                onChange={() => handleToggleArrivingSoon(movie)}
                                            />
                                            <span className="slider round"></span>
                                        </label>
                                    </td>
                                    <td>
                                        <div className="actions">
                                            <button onClick={() => handleEdit(movie.id)} className="btn-icon edit" title="Edit Movie">✏️</button>
                                            <button onClick={() => handleDelete(movie.id)} className="btn-icon delete" title="Delete Movie">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="pagination">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button>
                <span>Page {page} of {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
        </div>
    );
};

export default ManageMovies;
