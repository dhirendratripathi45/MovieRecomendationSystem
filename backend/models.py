from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid
import json

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

# Association tables
user_watch_history = db.Table('user_watch_history',
    db.Column('id', db.String(36), primary_key=True, default=generate_uuid),
    db.Column('user_id', db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
    db.Column('movie_id', db.String(36), db.ForeignKey('movies.id', ondelete='CASCADE'), nullable=False),
    db.Column('watched_at', db.DateTime, default=datetime.utcnow, nullable=False),
    db.Column('rating', db.Float),
    db.Column('liked', db.Boolean, default=False),
    db.Column('watch_duration', db.Integer),  # in minutes
    db.Column('created_at', db.DateTime, default=datetime.utcnow),
    mysql_engine='InnoDB',
    mysql_charset='utf8mb4'
)

user_favorites = db.Table('user_favorites',
    db.Column('id', db.String(36), primary_key=True, default=generate_uuid),
    db.Column('user_id', db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
    db.Column('movie_id', db.String(36), db.ForeignKey('movies.id', ondelete='CASCADE'), nullable=False),
    db.Column('added_at', db.DateTime, default=datetime.utcnow, nullable=False),
    db.Column('created_at', db.DateTime, default=datetime.utcnow),
    mysql_engine='InnoDB',
    mysql_charset='utf8mb4'
)

movie_genres = db.Table('movie_genres',
    db.Column('id', db.String(36), primary_key=True, default=generate_uuid),
    db.Column('movie_id', db.String(36), db.ForeignKey('movies.id', ondelete='CASCADE'), nullable=False),
    db.Column('genre_id', db.String(36), db.ForeignKey('genres.id', ondelete='CASCADE'), nullable=False),
    db.Column('created_at', db.DateTime, default=datetime.utcnow),
    mysql_engine='InnoDB',
    mysql_charset='utf8mb4'
)

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    first_name = db.Column(db.String(50))
    last_name = db.Column(db.String(50))
    profile_picture = db.Column(db.Text)  # URL or base64
    
    # Status
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    is_verified = db.Column(db.Boolean, default=False, nullable=False)
    last_login = db.Column(db.DateTime)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    watch_history = db.relationship('Movie', 
                                   secondary=user_watch_history,
                                   lazy='dynamic',
                                   backref=db.backref('watchers', lazy='dynamic'))
    
    favorites = db.relationship('Movie',
                               secondary=user_favorites,
                               lazy='dynamic',
                               backref=db.backref('favorited_by_users', lazy='dynamic'))
    
    preferences = db.relationship('UserPreference', backref='user', lazy=True, uselist=False)
    recommendations = db.relationship('Recommendation', backref='user', lazy=True)
    ratings = db.relationship('Rating', backref='user', lazy=True)
    
    __table_args__ = {
        'mysql_engine': 'InnoDB',
        'mysql_charset': 'utf8mb4'
    }
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'profile_picture': self.profile_picture,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class UserPreference(db.Model):
    __tablename__ = 'user_preferences'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False, index=True)
    
    # Language preferences
    preferred_language = db.Column(db.String(10), default='en')
    subtitle_language = db.Column(db.String(10))
    
    # Content preferences
    preferred_genres = db.Column(db.JSON)  # Array of genre IDs
    exclude_genres = db.Column(db.JSON)    # Array of genre IDs to exclude
    min_rating = db.Column(db.Float, default=6.0)
    max_runtime = db.Column(db.Integer, default=180)  # in minutes
    include_adult = db.Column(db.Boolean, default=False)
    
    # Notification preferences
    email_notifications = db.Column(db.Boolean, default=True)
    push_notifications = db.Column(db.Boolean, default=True)
    newsletter = db.Column(db.Boolean, default=True)
    
    # Algorithm preferences
    preferred_algorithm = db.Column(db.String(50), default='hybrid')  # collaborative, content-based, hybrid
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    __table_args__ = {
        'mysql_engine': 'InnoDB',
        'mysql_charset': 'utf8mb4'
    }

class Movie(db.Model):
    __tablename__ = 'movies'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    tmdb_id = db.Column(db.Integer, unique=True, index=True, nullable=False)
    imdb_id = db.Column(db.String(20), unique=True, index=True)
    
    # Basic info
    title = db.Column(db.String(255), nullable=False, index=True)
    original_title = db.Column(db.String(255), index=True)
    overview = db.Column(db.Text)
    tagline = db.Column(db.String(500))
    
    # Release info
    release_date = db.Column(db.Date, index=True)
    release_year = db.Column(db.Integer, index=True)
    status = db.Column(db.String(50))  # Released, In Production, etc.
    
    # Technical details
    runtime = db.Column(db.Integer)  # in minutes
    adult = db.Column(db.Boolean, default=False, nullable=False)
    original_language = db.Column(db.String(10))
    spoken_languages = db.Column(db.JSON)  # Array of language codes
    
    # Ratings and popularity
    vote_average = db.Column(db.Float, index=True)
    vote_count = db.Column(db.Integer)
    popularity = db.Column(db.Float, index=True)
    
    # Media URLs
    poster_path = db.Column(db.Text)
    backdrop_path = db.Column(db.Text)
    trailer_url = db.Column(db.Text)
    
    # Financial info
    budget = db.Column(db.BigInteger)
    revenue = db.Column(db.BigInteger)
    
    # External links
    homepage = db.Column(db.Text)
    
    # Metadata
    keywords = db.Column(db.JSON)  # Array of keywords
    production_countries = db.Column(db.JSON)  # Array of country codes
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    genres = db.relationship('Genre', secondary=movie_genres, lazy='dynamic', backref='movies')
    production_companies = db.relationship('ProductionCompany', backref='movie', lazy=True)
    crew = db.relationship('CrewMember', backref='movie', lazy=True)
    ratings = db.relationship('Rating', backref='movie', lazy=True)
    
    __table_args__ = {
        'mysql_engine': 'InnoDB',
        'mysql_charset': 'utf8mb4',
        'mysql_collate': 'utf8mb4_unicode_ci'
    }
    
    def __repr__(self):
        return f'<Movie {self.title} ({self.release_year})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'tmdb_id': self.tmdb_id,
            'imdb_id': self.imdb_id,
            'title': self.title,
            'original_title': self.original_title,
            'overview': self.overview,
            'tagline': self.tagline,
            'release_date': self.release_date.isoformat() if self.release_date else None,
            'release_year': self.release_year,
            'runtime': self.runtime,
            'adult': self.adult,
            'vote_average': self.vote_average,
            'vote_count': self.vote_count,
            'popularity': self.popularity,
            'poster_path': self.poster_path,
            'backdrop_path': self.backdrop_path,
            'trailer_url': self.trailer_url,
            'genres': [genre.to_dict() for genre in self.genres] if self.genres else []
        }

class Genre(db.Model):
    __tablename__ = 'genres'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    tmdb_id = db.Column(db.Integer, unique=True, nullable=False, index=True)
    name = db.Column(db.String(50), nullable=False, unique=True, index=True)
    description = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    __table_args__ = {
        'mysql_engine': 'InnoDB',
        'mysql_charset': 'utf8mb4'
    }
    
    def __repr__(self):
        return f'<Genre {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'tmdb_id': self.tmdb_id,
            'name': self.name,
            'description': self.description
        }

class ProductionCompany(db.Model):
    __tablename__ = 'production_companies'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    tmdb_id = db.Column(db.Integer, unique=True, index=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    logo_path = db.Column(db.Text)
    origin_country = db.Column(db.String(10))
    
    movie_id = db.Column(db.String(36), db.ForeignKey('movies.id', ondelete='CASCADE'), nullable=False, index=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    __table_args__ = {
        'mysql_engine': 'InnoDB',
        'mysql_charset': 'utf8mb4'
    }
    
    def __repr__(self):
        return f'<ProductionCompany {self.name}>'

class CrewMember(db.Model):
    __tablename__ = 'crew_members'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    tmdb_id = db.Column(db.Integer, index=True)
    name = db.Column(db.String(255), nullable=False, index=True)
    department = db.Column(db.String(100))  # Directing, Production, etc.
    job = db.Column(db.String(100))  # Director, Producer, etc.
    character = db.Column(db.String(255))  # For actors
    profile_path = db.Column(db.Text)
    order = db.Column(db.Integer)  # Order of appearance/importance
    
    movie_id = db.Column(db.String(36), db.ForeignKey('movies.id', ondelete='CASCADE'), nullable=False, index=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    __table_args__ = {
        'mysql_engine': 'InnoDB',
        'mysql_charset': 'utf8mb4'
    }
    
    def __repr__(self):
        return f'<CrewMember {self.name} ({self.job})>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'department': self.department,
            'job': self.job,
            'character': self.character,
            'profile_path': self.profile_path
        }

class Rating(db.Model):
    __tablename__ = 'ratings'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    movie_id = db.Column(db.String(36), db.ForeignKey('movies.id', ondelete='CASCADE'), nullable=False, index=True)
    
    rating = db.Column(db.Float, nullable=False)  # 0.5 to 5.0 in 0.5 increments
    review = db.Column(db.Text)
    liked = db.Column(db.Boolean, default=False)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'movie_id', name='unique_user_movie_rating'),
        {
            'mysql_engine': 'InnoDB',
            'mysql_charset': 'utf8mb4'
        }
    )
    
    def __repr__(self):
        return f'<Rating {self.user_id} -> {self.movie_id}: {self.rating}>'

class Recommendation(db.Model):
    __tablename__ = 'recommendations'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    movie_id = db.Column(db.String(36), db.ForeignKey('movies.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Recommendation metrics
    score = db.Column(db.Float, nullable=False, index=True)  # 0-1, how good the match is
    algorithm = db.Column(db.String(50), nullable=False)  # collaborative, content-based, hybrid
    reason = db.Column(db.Text)  # Why this movie was recommended
    
    # User interaction tracking
    shown_at = db.Column(db.DateTime, default=datetime.utcnow)
    clicked = db.Column(db.Boolean, default=False)
    clicked_at = db.Column(db.DateTime)
    watched = db.Column(db.Boolean, default=False)
    watched_at = db.Column(db.DateTime)
    feedback_rating = db.Column(db.Integer)  # 1-5 rating of recommendation quality
    feedback_comment = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'movie_id', name='unique_user_movie_recommendation'),
        db.Index('idx_recommendation_score', 'user_id', 'score'),
        {
            'mysql_engine': 'InnoDB',
            'mysql_charset': 'utf8mb4'
        }
    )
    
    def __repr__(self):
        return f'<Recommendation {self.user_id} -> {self.movie_id} ({self.score})>'

class Watchlist(db.Model):
    __tablename__ = 'watchlists'
    
    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    movie_id = db.Column(db.String(36), db.ForeignKey('movies.id', ondelete='CASCADE'), nullable=False, index=True)
    name = db.Column(db.String(100), default='My Watchlist')  # For multiple watchlists
    
    notes = db.Column(db.Text)
    priority = db.Column(db.Integer, default=1)  # 1-5 priority level
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'movie_id', 'name', name='unique_watchlist_item'),
        {
            'mysql_engine': 'InnoDB',
            'mysql_charset': 'utf8mb4'
        }
    )
    
    def __repr__(self):
        return f'<Watchlist {self.user_id} -> {self.movie_id}>'