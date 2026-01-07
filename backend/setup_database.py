import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

load_dotenv()

def create_database():
    """Create MySQL database if it doesn't exist"""
    try:
        connection = mysql.connector.connect(
            host=os.environ.get('MYSQL_HOST', 'localhost'),
            port=os.environ.get('MYSQL_PORT', '3306'),
            user=os.environ.get('MYSQL_USER', 'root'),
            password=os.environ.get('MYSQL_PASSWORD', '')
        )
        
        if connection.is_connected():
            cursor = connection.cursor()
            database_name = os.environ.get('MYSQL_DATABASE', 'movie_recommendation')
            
            # Create database
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {database_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"Database '{database_name}' created successfully!")
            
            # Create user with privileges
            db_user = os.environ.get('MYSQL_APP_USER', 'movie_app')
            db_password = os.environ.get('MYSQL_APP_PASSWORD', 'movie_password')
            
            cursor.execute(f"CREATE USER IF NOT EXISTS '{db_user}'@'%' IDENTIFIED BY '{db_password}'")
            cursor.execute(f"GRANT ALL PRIVILEGES ON {database_name}.* TO '{db_user}'@'%'")
            cursor.execute("FLUSH PRIVILEGES")
            print(f"User '{db_user}' created with privileges!")
            
    except Error as e:
        print(f"Error while connecting to MySQL: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

def init_sample_data():
    """Insert sample data into the database"""
    from app import create_app
    from models import db, Genre, User, Movie
    from flask_bcrypt import Bcrypt
    
    app = create_app()
    bcrypt = Bcrypt(app)
    
    with app.app_context():
        # Create tables
        db.create_all()
        print("Tables created successfully!")
        
        # Insert default genres
        default_genres = [
            {"tmdb_id": 28, "name": "Action", "description": "High-energy physical stunts and chases"},
            {"tmdb_id": 12, "name": "Adventure", "description": "Exciting journeys and explorations"},
            {"tmdb_id": 16, "name": "Animation", "description": "Animated films and cartoons"},
            {"tmdb_id": 35, "name": "Comedy", "description": "Funny and humorous films"},
            {"tmdb_id": 80, "name": "Crime", "description": "Stories centered on criminal activity"},
            {"tmdb_id": 99, "name": "Documentary", "description": "Non-fiction factual films"},
            {"tmdb_id": 18, "name": "Drama", "description": "Serious, character-driven stories"},
            {"tmdb_id": 10751, "name": "Family", "description": "Films suitable for all ages"},
            {"tmdb_id": 14, "name": "Fantasy", "description": "Magical and supernatural elements"},
            {"tmdb_id": 36, "name": "History", "description": "Historical events and periods"},
            {"tmdb_id": 27, "name": "Horror", "description": "Scary and frightening films"},
            {"tmdb_id": 10402, "name": "Music", "description": "Musical films and concerts"},
            {"tmdb_id": 9648, "name": "Mystery", "description": "Puzzles and investigations"},
            {"tmdb_id": 10749, "name": "Romance", "description": "Love stories and relationships"},
            {"tmdb_id": 878, "name": "Science Fiction", "description": "Futuristic technology and space"},
            {"tmdb_id": 10770, "name": "TV Movie", "description": "Made-for-television films"},
            {"tmdb_id": 53, "name": "Thriller", "description": "Suspenseful and tense stories"},
            {"tmdb_id": 10752, "name": "War", "description": "Military conflicts and battles"},
            {"tmdb_id": 37, "name": "Western", "description": "American frontier stories"}
        ]
        
        for genre_data in default_genres:
            genre = Genre.query.filter_by(tmdb_id=genre_data["tmdb_id"]).first()
            if not genre:
                genre = Genre(
                    tmdb_id=genre_data["tmdb_id"],
                    name=genre_data["name"],
                    description=genre_data["description"]
                )
                db.session.add(genre)
        
        # Create admin user
        admin = User.query.filter_by(email='admin@movierec.com').first()
        if not admin:
            hashed_password = bcrypt.generate_password_hash('Admin@123').decode('utf-8')
            admin = User(
                email='admin@movierec.com',
                username='admin',
                password_hash=hashed_password,
                first_name='Admin',
                last_name='User',
                is_verified=True
            )
            db.session.add(admin)
        
        db.session.commit()
        print("Sample data inserted successfully!")

if __name__ == '__main__':
    print("Setting up MySQL database for Movie Recommendation System...")
    create_database()
    init_sample_data()
    print("Database setup completed!")