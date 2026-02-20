import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
  // Removed global 'Content-Type': 'application/json' to allow FormData to work correctly
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  demoLogin: () => API.post('/auth/demo-login'),
  logout: () => API.post('/auth/logout'),
  getCurrentUser: () => API.get('/auth/me'),
  validateToken: () => API.post('/auth/validate-token'),
  updateProfile: (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
  getProfile: () => API.get('/auth/profile'),
};

export const adminAPI = {
  getStats: () => API.get('/admin/stats'),
  getMovies: (page, search, options = {}) => {
    const { is_trending, is_arriving_soon, sort_by } = options;
    let query = `/admin/movies?page=${page}&search=${search || ''}`;
    if (is_trending !== undefined) query += `&is_trending=${is_trending}`;
    if (is_arriving_soon !== undefined) query += `&is_arriving_soon=${is_arriving_soon}`;
    if (sort_by) query += `&sort_by=${sort_by}`;
    return API.get(query);
  },
  addMovie: (movieData) => API.post('/admin/movies', movieData),
  updateMovie: (id, movieData) => API.put(`/admin/movies/${id}`, movieData),
  deleteMovie: (id) => API.delete(`/admin/movies/${id}`),
  getUsers: (search) => API.get(`/admin/users?search=${search || ''}`),
  getUserDetails: (id) => API.get(`/admin/users/${id}`),
  getActivity: () => API.get('/admin/activity'),
};

export const recommendationAPI = {
  getCollaborative: (userId) => API.get(`/recommend/collaborative/${userId}`),
  getHybrid: (userId) => API.get(`/recommend/hybrid/${userId}`),
  getContentBased: (movieTitle) => API.get(`/recommend/content/${encodeURIComponent(movieTitle)}`),
  getTrending: () => API.get('/recommend/trending'),
  getArrivingSoon: () => API.get('/recommend/arriving-soon'),
  getMostRated: () => API.get('/recommend/most-rated'),
  getMostViewed: () => API.get('/recommend/most-viewed'),
  getAll: (page = 1, limit = 20, genre = '', search = '', country = '') =>
    API.get(`/recommend/all?page=${page}&limit=${limit}&genre=${genre ? encodeURIComponent(genre) : ''}&search=${search ? encodeURIComponent(search) : ''}&country=${country ? encodeURIComponent(country) : ''}`),
  getGenres: () => API.get('/recommend/genres'),
  getMoviesByGenre: (genreId) => API.get(`/recommend/genres/${genreId}`),
  getMovie: (id) => API.get(`/recommend/movie/${id}`),
  rateMovie: (data) => API.post('/recommend/rate', data),
  getRatedMovies: () => API.get('/recommend/rated'),
};

export const watchlistAPI = {
  get: () => API.get('/watchlist'),
  add: (movieData) => API.post('/watchlist/add', movieData),
  remove: (movieId) => API.delete(`/watchlist/remove/${movieId}`),
};



export default API;