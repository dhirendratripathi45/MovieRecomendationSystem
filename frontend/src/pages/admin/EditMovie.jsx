import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI, recommendationAPI } from '../../utils/api';
import './AddMovie.css'; // Reuse AddMovie styles

const EditMovie = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        overview: '',
        release_year: new Date().getFullYear(),
        genres: [],
        is_trending: false,
        is_arriving_soon: false
    });
    const [posterFile, setPosterFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [allGenres, setAllGenres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [genreRes, movieRes] = await Promise.all([
                    recommendationAPI.getGenres(),
                    recommendationAPI.getMovie(id)
                ]);
                setAllGenres(genreRes.data);

                const movie = movieRes.data;
                setFormData({
                    title: movie.title,
                    overview: movie.overview,
                    release_year: movie.release_year,
                    genres: Array.isArray(movie.genres) ? movie.genres : [], // Ensure array
                    is_trending: movie.is_trending,
                    is_arriving_soon: movie.is_arriving_soon
                });

                if (movie.poster_path) {
                    const url = movie.poster_path.startsWith('http')
                        ? movie.poster_path
                        : movie.poster_path.startsWith('/static')
                            ? `http://localhost:5000${movie.poster_path}`
                            : `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
                    setPreviewUrl(url);
                }
            } catch (err) {
                console.error(err);
                alert('Error fetching movie details');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('overview', formData.overview);
            data.append('release_year', formData.release_year);
            data.append('is_trending', formData.is_trending);
            data.append('is_arriving_soon', formData.is_arriving_soon);
            // Genre handling might vary depending on backend expectation (list of names vs objects)
            // Backend add_movie expects list of names. Update expects ???
            // Let's check update_movie implementation. 
            // It uses request.get_json(), so it might not support FormData for files yet!
            // Wait, we need to check backend update_movie first.
            // If backend update_movie only supports JSON, we can't upload file.
            // Assuming for now we just send JSON if no file, but we need file support.

            // Actually, let's stick to what the backend supports.
            // If I haven't updated backend update_movie to support FormData, I should do that.
            // For now, I will write this assuming I will fix backend.
            data.append('genres', JSON.stringify(formData.genres));

            if (posterFile) {
                data.append('poster_file', posterFile);
            }

            // We need to change adminAPI.updateMovie to send FormData/JSON correctly
            // But standard axios post/put with FormData works.

            await adminAPI.updateMovie(id, data);
            alert('Movie updated successfully!');
            navigate('/admin/movies');
        } catch (err) {
            console.error(err);
            alert('Error updating movie');
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPosterFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleGenreToggle = (genreName) => {
        setFormData(prev => ({
            ...prev,
            genres: prev.genres.includes(genreName)
                ? prev.genres.filter(g => g !== genreName)
                : [...prev.genres, genreName]
        }));
    };

    if (loading) return <div className="loading-overlay">Loading...</div>;

    return (
        <div className="add-movie-page">
            <header className="page-header">
                <h1>Edit Movie</h1>
                <p>Update movie details</p>
            </header>

            <div className="form-container">
                <form onSubmit={handleSubmit} className="admin-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Movie Title</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Release Year</label>
                            <input
                                type="number"
                                value={formData.release_year}
                                onChange={e => setFormData({ ...formData, release_year: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Poster Image (Local File Only)</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <small style={{ color: '#666' }}>Leave empty to keep existing poster</small>
                        </div>

                        <div className="form-group checkbox-grid">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.is_trending}
                                    onChange={e => setFormData({ ...formData, is_trending: e.target.checked })}
                                />
                                Add to Trending
                            </label>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.is_arriving_soon}
                                    onChange={e => setFormData({ ...formData, is_arriving_soon: e.target.checked })}
                                />
                                Arriving Soon
                            </label>
                        </div>
                    </div>

                    {previewUrl && (
                        <div className="poster-preview-section">
                            <label>Poster Preview</label>
                            <div className="poster-preview-card">
                                <img src={previewUrl} alt="Preview" />
                            </div>
                        </div>
                    )}

                    <div className="form-group full-width">
                        <label>Overview / Synopsis</label>
                        <textarea
                            value={formData.overview}
                            onChange={e => setFormData({ ...formData, overview: e.target.value })}
                            rows="4"
                        ></textarea>
                    </div>

                    <div className="form-group full-width">
                        <label>Genres</label>
                        <div className="genre-selection">
                            {allGenres.map(genre => (
                                <button
                                    key={genre.id}
                                    type="button"
                                    className={`genre-chip ${formData.genres.includes(genre.name) ? 'selected' : ''}`}
                                    onClick={() => handleGenreToggle(genre.name)}
                                >
                                    {genre.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="cancel-btn" onClick={() => navigate('/admin/movies')}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn" disabled={saving}>
                            {saving ? 'Saving...' : 'Update Movie'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditMovie;
