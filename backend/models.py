from mongoengine import *
from datetime import datetime
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class Genre(Document):
    meta = {'collection': 'genres'}
    
    tmdb_id = IntField(unique=True, required=True)
    name = StringField(max_length=50, required=True, unique=True)
    description = StringField()
    
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'tmdb_id': self.tmdb_id,
            'name': self.name,
            'description': self.description
        }

class ProductionCompany(EmbeddedDocument):
    tmdb_id = IntField()
    name = StringField(required=True)
    logo_path = StringField()
    origin_country = StringField(max_length=10)

class CrewMember(EmbeddedDocument):
    tmdb_id = IntField()
    name = StringField(required=True)
    department = StringField(max_length=100)
    job = StringField(max_length=100)
    character = StringField()
    profile_path = StringField()
    order = IntField()
    
    def to_dict(self):
        return {
            'name': self.name,
            'department': self.department,
            'job': self.job,
            'character': self.character,
            'profile_path': self.profile_path
        }

class Rating(EmbeddedDocument):
    user_id = ReferenceField('User')
    rating = FloatField(required=True)  # 0.5 to 5.0
    review = StringField()
    liked = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Rating {self.rating}>'

class Movie(Document):
    meta = {
        'collection': 'movies',
        'indexes': [
            'tmdb_id',
            'title',
            'release_year',
            '$title',  # text index
            'genres'
        ]
    }
    
    tmdb_id = IntField(unique=True, required=True)
    movie_id = IntField(unique=True) # ID from the original CSV dataset
    imdb_id = StringField(max_length=20, unique=True)
    
    # Basic info
    title = StringField(max_length=255, required=True)
    original_title = StringField(max_length=255)
    overview = StringField()
    tagline = StringField(max_length=500)
    
    # Release info
    release_date = DateTimeField()
    release_year = IntField()
    status = StringField(max_length=50)
    
    # Technical details
    runtime = IntField()  # in minutes
    adult = BooleanField(default=False)
    original_language = StringField(max_length=10)
    spoken_languages = ListField(StringField())
    
    # Ratings and popularity
    vote_average = FloatField()
    vote_count = IntField()
    popularity = FloatField()
    
    # Custom flags
    is_trending = BooleanField(default=False)
    is_arriving_soon = BooleanField(default=False)
    view_count = IntField(default=0)
    
    # Media URLs
    poster_path = StringField()
    backdrop_path = StringField()
    trailer_url = StringField()
    
    # Financial info
    budget = LongField()
    revenue = LongField()
    
    # External links
    homepage = StringField()
    
    # Metadata
    keywords = ListField(StringField())
    production_countries = ListField(StringField())
    
    # Timestamps
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    # Relationships
    genres = ListField(ReferenceField(Genre))
    genres_list = ListField(StringField()) # Store raw genre strings from CSV
    production_companies = ListField(EmbeddedDocumentField(ProductionCompany))
    crew = ListField(EmbeddedDocumentField(CrewMember))
    ratings = ListField(EmbeddedDocumentField(Rating))
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'movieId': self.movie_id,
            'tmdbId': self.tmdb_id,
            'imdbId': self.imdb_id,
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
            'genres': self.genres_list if self.genres_list else ([genre.to_dict() for genre in self.genres] if self.genres else []),
            'is_trending': self.is_trending,
            'is_arriving_soon': self.is_arriving_soon
        }

class UserPreference(EmbeddedDocument):
    # Language preferences
    preferred_language = StringField(max_length=10, default='en')
    subtitle_language = StringField(max_length=10)
    
    # Content preferences
    preferred_genres = ListField(StringField())  # Array of genre IDs
    exclude_genres = ListField(StringField())
    min_rating = FloatField(default=6.0)
    max_runtime = IntField(default=180)
    include_adult = BooleanField(default=False)
    
    # Notification preferences
    email_notifications = BooleanField(default=True)
    push_notifications = BooleanField(default=True)
    newsletter = BooleanField(default=True)
    
    # Algorithm preferences
    preferred_algorithm = StringField(max_length=50, default='hybrid')
    
    updated_at = DateTimeField(default=datetime.utcnow)

class UserRating(EmbeddedDocument):
    movie_id = IntField(required=True)
    score = IntField(required=True) # 1-5
    timestamp = DateTimeField(default=datetime.utcnow)

class UserWatchHistory(EmbeddedDocument):
    movie = ReferenceField(Movie, required=True)
    watched_at = DateTimeField(default=datetime.utcnow)
    rating = FloatField()
    liked = BooleanField(default=False)
    watch_duration = IntField()  # in minutes

class User(Document):
    meta = {'collection': 'users'}
    
    email = StringField(max_length=120, unique=True, required=True)
    username = StringField(max_length=80, unique=True, required=True)
    password_hash = StringField(max_length=128, required=True)
    first_name = StringField(max_length=50)
    last_name = StringField(max_length=50)
    profile_picture = StringField()
    
    # Status
    is_active = BooleanField(default=True)
    is_verified = BooleanField(default=False)
    last_login = DateTimeField()
    
    # Timestamps
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)
    
    watch_history = ListField(EmbeddedDocumentField(UserWatchHistory))
    favorites = ListField(ReferenceField(Movie))
    ratings = ListField(EmbeddedDocumentField(UserRating))
    
    preferences = EmbeddedDocumentField(UserPreference)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'email': self.email,
            'username': self.username,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'profile_picture': self.profile_picture,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Recommendation(Document):
    meta = {
        'collection': 'recommendations',
        'indexes': [
            'user',
            '-score' # descending
        ]
    }
    
    user = ReferenceField(User, required=True)
    movie = ReferenceField(Movie, required=True)
    
    # Recommendation metrics
    score = FloatField(required=True)  # 0-1
    algorithm = StringField(max_length=50, required=True)
    reason = StringField()
    
    # User interaction tracking
    shown_at = DateTimeField(default=datetime.utcnow)
    clicked = BooleanField(default=False)
    clicked_at = DateTimeField()
    watched = BooleanField(default=False)
    watched_at = DateTimeField()
    feedback_rating = IntField()
    feedback_comment = StringField()
    
    created_at = DateTimeField(default=datetime.utcnow)
    updated_at = DateTimeField(default=datetime.utcnow)

class Watchlist(Document):
    meta = {'collection': 'watchlists'}
    
    user = ReferenceField(User, required=True)
    movie_id = IntField(required=True)
    title = StringField()
    genres = StringField()
    tmdb_id = IntField()
    
    created_at = DateTimeField(default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'movieId': self.movie_id,
            'title': self.title,
            'genres': self.genres,
            'tmdbId': self.tmdb_id,
            'created_at': self.created_at.isoformat()
        }

class RatedMovie(Document):
    meta = {
        'collection': 'rated_movies',
        'indexes': [
            'user',
            'movie_id',
            '-created_at'
        ]
    }
    
    user = ReferenceField(User, required=True)
    movie_id = IntField(required=True) # Matches Movie.movie_id
    score = FloatField(required=True)
    review = StringField()
    created_at = DateTimeField(default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': str(self.id),
            'movie_id': self.movie_id,
            'score': self.score,
            'review': self.review,
            'created_at': self.created_at.isoformat()
        }