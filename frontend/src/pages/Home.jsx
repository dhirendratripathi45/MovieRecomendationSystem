import { useState, useEffect } from 'react';
import './Home.css';
import Navbar from '../components/Navbar';  // Changed from './components/Navbar'?

const Home = () => {
  const [user, setUser] = useState({
    name: 'Movie Lover',
    avatar: 'https://randomuser.me/api/portraits/men/75.jpg'
  });

  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [watchlist, setWatchlist] = useState([]);

  // Movie Data
  const [movies, setMovies] = useState([
    {
      id: 1,
      title: "Inception",
      year: 2010,
      rating: 8.8,
      genre: ["Sci-Fi", "Action", "Thriller"],
      poster: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
      description: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
      director: "Christopher Nolan",
      duration: "2h 28m",
      cast: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Ellen Page"],
      isTrending: true,
      isTopRated: true
    },
    {
      id: 2,
      title: "The Shawshank Redemption",
      year: 1994,
      rating: 9.3,
      genre: ["Drama"],
      poster: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      description: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.",
      director: "Frank Darabont",
      duration: "2h 22m",
      cast: ["Tim Robbins", "Morgan Freeman", "Bob Gunton"],
      isTrending: true,
      isTopRated: true
    },
    {
      id: 3,
      title: "Parasite",
      year: 2019,
      rating: 8.6,
      genre: ["Comedy", "Drama", "Thriller"],
      poster: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
      description: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
      director: "Bong Joon Ho",
      duration: "2h 12m",
      cast: ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong"],
      isTrending: true,
      isTopRated: false
    },
    {
      id: 4,
      title: "The Dark Knight",
      year: 2008,
      rating: 9.0,
      genre: ["Action", "Crime", "Drama"],
      poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
      director: "Christopher Nolan",
      duration: "2h 32m",
      cast: ["Christian Bale", "Heath Ledger", "Aaron Eckhart"],
      isTrending: false,
      isTopRated: true
    },
    {
      id: 5,
      title: "Spirited Away",
      year: 2001,
      rating: 8.6,
      genre: ["Animation", "Adventure", "Family"],
      poster: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
      description: "During her family's move to the suburbs, a sullen 10-year-old girl wanders into a world ruled by gods, witches, and spirits.",
      director: "Hayao Miyazaki",
      duration: "2h 5m",
      cast: ["Rumi Hiiragi", "Miyu Irino", "Mari Natsuki"],
      isTrending: true,
      isTopRated: false
    },
    {
      id: 6,
      title: "Interstellar",
      year: 2014,
      rating: 8.6,
      genre: ["Adventure", "Drama", "Sci-Fi"],
      poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      description: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival.",
      director: "Christopher Nolan",
      duration: "2h 49m",
      cast: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"],
      isTrending: false,
      isTopRated: true
    },
    {
      id: 7,
      title: "Pulp Fiction",
      year: 1994,
      rating: 8.9,
      genre: ["Crime", "Drama"],
      poster: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
      description: "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
      director: "Quentin Tarantino",
      duration: "2h 34m",
      cast: ["John Travolta", "Uma Thurman", "Samuel L. Jackson"],
      isTrending: false,
      isTopRated: true
    },
    {
      id: 8,
      title: "The Godfather",
      year: 1972,
      rating: 9.2,
      genre: ["Crime", "Drama"],
      poster: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
      description: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.",
      director: "Francis Ford Coppola",
      duration: "2h 55m",
      cast: ["Marlon Brando", "Al Pacino", "James Caan"],
      isTrending: false,
      isTopRated: true
    },
    {
      id: 9,
      title: "Avengers: Endgame",
      year: 2019,
      rating: 8.4,
      genre: ["Action", "Adventure", "Drama"],
      poster: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
      description: "After the devastating events of Infinity War, the Avengers assemble once more in order to reverse Thanos' actions and restore balance to the universe.",
      director: "Anthony Russo, Joe Russo",
      duration: "3h 2m",
      cast: ["Robert Downey Jr.", "Chris Evans", "Scarlett Johansson"],
      isTrending: true,
      isTopRated: false
    },
    {
      id: 10,
      title: "La La Land",
      year: 2016,
      rating: 8.0,
      genre: ["Comedy", "Drama", "Music"],
      poster: "https://image.tmdb.org/t/p/w500/uDO8zWDhfWwoFdKS4fzkUJt0Rf0.jpg",
      description: "While navigating their careers in Los Angeles, a pianist and an actress fall in love while attempting to reconcile their aspirations for the future.",
      director: "Damien Chazelle",
      duration: "2h 8m",
      cast: ["Ryan Gosling", "Emma Stone", "John Legend"],
      isTrending: false,
      isTopRated: false
    }
  ]);

  const genres = ['All', 'Action', 'Drama', 'Comedy', 'Sci-Fi', 'Thriller', 'Crime', 'Animation', 'Adventure', 'Family'];

  // Filter movies based on genre and search
  useEffect(() => {
    let result = [...movies];
    
    if (selectedGenre !== 'All') {
      result = result.filter(movie => movie.genre.includes(selectedGenre));
    }
    
    if (searchQuery) {
      result = result.filter(movie => 
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.cast.some(actor => actor.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    setFilteredMovies(result);
  }, [selectedGenre, searchQuery, movies]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const toggleWatchlist = (movieId) => {
    if (watchlist.includes(movieId)) {
      setWatchlist(watchlist.filter(id => id !== movieId));
    } else {
      setWatchlist([...watchlist, movieId]);
    }
  };

  const trendingMovies = movies.filter(movie => movie.isTrending);
  const topRatedMovies = movies.filter(movie => movie.isTopRated);

  return (
    <div className="home">
      {/* <Navbar 
        onSearch={handleSearch}
        user={user}
      /> */}

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Discover Movies <span className="highlight">You'll Love</span>
          </h1>
          <p className="hero-subtitle">
            Personalized movie recommendations based on your taste, mood, and watch history
          </p>
          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">10,000+</span>
              <span className="stat-label">Movies</span>
            </div>
            <div className="stat">
              <span className="stat-number">500+</span>
              <span className="stat-label">Genres</span>
            </div>
            <div className="stat">
              <span className="stat-number">98%</span>
              <span className="stat-label">Match Accuracy</span>
            </div>
          </div>
          <button className="cta-button">
            Get Personalized Recommendations
          </button>
        </div>
        <div className="hero-image">
          <div className="floating-cards">
            {trendingMovies.slice(0, 3).map((movie, index) => (
              <div 
                key={movie.id} 
                className="floating-card"
                style={{ animationDelay: `${index * 0.5}s` }}
              >
                <img src={movie.poster} alt={movie.title} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Filters */}
      <section className="filters-section">
        <div className="section-header">
          <h2>Browse by Genre</h2>
          <p>Find movies that match your mood</p>
        </div>
        <div className="genre-filters">
          {genres.map(genre => (
            <button
              key={genre}
              className={`genre-filter ${selectedGenre === genre ? 'active' : ''}`}
              onClick={() => setSelectedGenre(genre)}
            >
              {genre}
            </button>
          ))}
        </div>
      </section>

      {/* Trending Now */}
      <section className="trending-section">
        <div className="section-header">
          <h2>🔥 Trending Now</h2>
          <p>What everyone is watching right now</p>
        </div>
        <div className="movies-carousel">
          {trendingMovies.map(movie => (
            <div key={movie.id} className="movie-card trending">
              <div className="movie-card-content">
                <img src={movie.poster} alt={movie.title} className="movie-poster" />
                <div className="movie-overlay">
                  <div className="movie-info">
                    <h3>{movie.title}</h3>
                    <div className="movie-meta">
                      <span>{movie.year}</span>
                      <span>•</span>
                      <span>{movie.duration}</span>
                    </div>
                    <div className="movie-actions">
                      <button 
                        className={`watchlist-btn ${watchlist.includes(movie.id) ? 'in-watchlist' : ''}`}
                        onClick={() => toggleWatchlist(movie.id)}
                      >
                        {watchlist.includes(movie.id) ? '✓ In Watchlist' : '+ Watchlist'}
                      </button>
                      <button className="play-btn">
                        ▶ Play
                      </button>
                    </div>
                  </div>
                </div>
                <div className="movie-badge">Trending</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Rated */}
      <section className="top-rated-section">
        <div className="section-header">
          <h2>⭐ Top Rated Movies</h2>
          <p>Highest rated movies of all time</p>
        </div>
        <div className="top-rated-grid">
          {topRatedMovies.map(movie => (
            <div key={movie.id} className="top-rated-card">
              <div className="rank">#{movies.indexOf(movie) + 1}</div>
              <img src={movie.poster} alt={movie.title} />
              <div className="top-rated-info">
                <h3>{movie.title}</h3>
                <div className="rating">
                  <span className="stars">{"★".repeat(Math.floor(movie.rating))}</span>
                  <span className="rating-number">{movie.rating}/10</span>
                </div>
                <p className="description">{movie.description.substring(0, 100)}...</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Movie Grid */}
      <section className="movies-grid-section">
        <div className="section-header">
          <h2>{selectedGenre === 'All' ? 'All Movies' : selectedGenre + ' Movies'}</h2>
          <p>{filteredMovies.length} movies found</p>
        </div>
        <div className="movies-grid">
          {filteredMovies.map(movie => (
            <div key={movie.id} className="movie-grid-card">
              <div className="poster-container">
                <img src={movie.poster} alt={movie.title} />
                <div className="hover-overlay">
                  <button 
                    className="quick-action-btn"
                    onClick={() => toggleWatchlist(movie.id)}
                  >
                    {watchlist.includes(movie.id) ? 'Remove' : 'Add to Watchlist'}
                  </button>
                  <button className="quick-action-btn info">
                    View Details
                  </button>
                </div>
                <div className="movie-rating">
                  ⭐ {movie.rating}
                </div>
              </div>
              <div className="movie-grid-info">
                <h3>{movie.title}</h3>
                <div className="movie-grid-meta">
                  <span>{movie.year}</span>
                  <span>•</span>
                  <span>{movie.duration}</span>
                  <span>•</span>
                  <span>{movie.genre[0]}</span>
                </div>
                <p className="movie-grid-description">
                  {movie.description.substring(0, 80)}...
                </p>
                <div className="movie-grid-cast">
                  <span>Starring: </span>
                  {movie.cast.slice(0, 2).join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Personalized Recommendations */}
      <section className="personalized-section">
        <div className="section-header">
          <h2>🎯 Personalized For You</h2>
          <p>Based on your watching history and ratings</p>
        </div>
        <div className="personalized-grid">
          {movies.slice(0, 4).map(movie => (
            <div key={movie.id} className="personalized-card">
              <div className="match-score">
                <div className="score-circle">
                  <span>92%</span>
                  <small>Match</small>
                </div>
              </div>
              <img src={movie.poster} alt={movie.title} />
              <div className="personalized-info">
                <h3>{movie.title}</h3>
                <p>Because you watched similar movies</p>
                <div className="tags">
                  {movie.genre.map(g => (
                    <span key={g} className="tag">{g}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>MovieRec</h3>
            <p>Your personal movie recommendation engine</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#trending">Trending</a></li>
              <li><a href="#top-rated">Top Rated</a></li>
              <li><a href="#genres">Genres</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Connect</h4>
            <div className="social-links">
              <a href="#" className="social-link">Twitter</a>
              <a href="#" className="social-link">Facebook</a>
              <a href="#" className="social-link">Instagram</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 MovieRec. All movie data is from TMDB.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;