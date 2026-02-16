import React, { useState, useEffect } from 'react';
import { adminAPI, recommendationAPI } from '../../utils/api';
import './AddMovie.css';

const AddMovie = () => {
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
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchGenres = async () => {
            try {
                const res = await recommendationAPI.getGenres();
                setAllGenres(res.data);
            } catch (err) { console.error(err); }
        };
        fetchGenres();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('overview', formData.overview);
            data.append('release_year', formData.release_year);
            data.append('is_trending', formData.is_trending);
            data.append('is_arriving_soon', formData.is_arriving_soon);
            data.append('genres', JSON.stringify(formData.genres));

            if (posterFile) {
                data.append('poster_file', posterFile);
            }

            await adminAPI.addMovie(data);
            alert('Movie added successfully!');
            setFormData({
                title: '',
                overview: '',
                release_year: new Date().getFullYear(),
                genres: [],
                is_trending: false,
                is_arriving_soon: false
            });
            setPosterFile(null);
            setPreviewUrl('');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Error adding movie');
        } finally {
            setLoading(false);
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

    return (
        <div className="add-movie-page">
            <header className="page-header">
                <h1>Add New Movie</h1>
                <p>Register a new movie in the database</p>
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
                                placeholder="Enter movie title"
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
                                required
                                onChange={handleFileChange}
                            />
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
                            placeholder="Write a brief description..."
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
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Processing...' : 'Add Movie to Database'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddMovie;
