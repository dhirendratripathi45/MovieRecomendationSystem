import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

class Config:
    # MongoDB Configuration
    MONGODB_SETTINGS = {
        'db': os.environ.get('MONGODB_DB', 'movie_recomendation_system'),
        'host': os.environ.get('MONGODB_HOST', '127.0.0.1'),
        'port': int(os.environ.get('MONGODB_PORT', 27017))
    }
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    JWT_COOKIE_SECURE = False  # Set to True in production with HTTPS
    JWT_COOKIE_CSRF_PROTECT = True
    
    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your-super-secret-key-change-this')
    BCRYPT_LOG_ROUNDS = 13
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://localhost:5174,http://localhost:5175').split(',')
    
    # Rate Limiting
    RATELIMIT_DEFAULT = "200 per hour"
    
    # Cache
    CACHE_TYPE = 'null' # Disable caching effectively
    CACHE_DEFAULT_TIMEOUT = 300
    
    # API Configuration
    TMDB_API_KEY = os.environ.get('TMDB_API_KEY', '')
    TMDB_BASE_URL = 'https://api.themoviedb.org/3'