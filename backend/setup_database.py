from app import create_app
from models import Genre, User
from flask_bcrypt import Bcrypt
import os

def init_sample_data():
    """Insert sample data into the database"""
    app = create_app()
    bcrypt = Bcrypt(app)
    
    with app.app_context():
        # Insert default genres
        default_genres = [
            {"tmdb_id": 28, "name": "Action", "description": "High-energy physical stunts and chases"},
            {"tmdb_id": 10759, "name": "Action & Adventure", "description": "High-energy adventure stories"},
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
            {"tmdb_id": 37, "name": "Western", "description": "American frontier stories"},
            {"tmdb_id": 10765, "name": "Sci-Fi & Fantasy", "description": "Speculative fiction stories"},
            {"tmdb_id": 98, "name": "Biography", "description": "Life stories of real people"},
            {"tmdb_id": 2, "name": "Sport", "description": "Athletic competitions and sports stories"},
            {"tmdb_id": 3, "name": "Mythological", "description": "Gods, legends and ancient myths"},
            {"tmdb_id": 4, "name": "Sci-Fi", "description": "Science fiction movies"},
            {"tmdb_id": 5, "name": "Psychological", "description": "Character's mental and emotional state"}
        ]
        
        print("Checking genres...")
        for genre_data in default_genres:
            if not Genre.objects(tmdb_id=genre_data["tmdb_id"]).first():
                genre = Genre(
                    tmdb_id=genre_data["tmdb_id"],
                    name=genre_data["name"],
                    description=genre_data["description"]
                )
                genre.save()
                print(f"Added genre: {genre_data['name']}")
        
        # Create admin user
        print("Checking admin user...")
        admin_email = 'admin@movierec.com'
        if not User.objects(email=admin_email).first():
            hashed_password = bcrypt.generate_password_hash('Admin@123').decode('utf-8')
            admin = User(
                email=admin_email,
                username='admin',
                password_hash=hashed_password,
                first_name='Admin',
                last_name='User',
                is_verified=True
            )
            admin.save()
            print("Admin user created!")
        
        print("Sample data check completed!")

if __name__ == '__main__':
    print("Setting up MongoDB database for Movie Recommendation System...")
    # No explicit create_database needed for MongoDB
    init_sample_data()
    print("Database setup completed!")