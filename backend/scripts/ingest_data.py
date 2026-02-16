
import os
import sys
import pandas as pd
from mongoengine import connect, disconnect
from datetime import datetime

# Add backend directory to path to import models and config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import Movie, Genre
from config import Config

def clean_genres(genres_str):
    if pd.isna(genres_str) or genres_str == '(no genres listed)':
        return []
    return genres_str.split('|')

def ingest_data():
    print("Connecting to MongoDB...")
    connect(
        db=Config.MONGODB_SETTINGS['db'],
        host=Config.MONGODB_SETTINGS['host'],
        port=Config.MONGODB_SETTINGS['port']
    )

    base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_path = os.path.join(base_path, 'dataset')
    
    movies_path = os.path.join(dataset_path, 'movies.csv')
    links_path = os.path.join(dataset_path, 'links.csv')

    print(f"Reading CSV files from {dataset_path}...")
    movies_df = pd.read_csv(movies_path)
    links_df = pd.read_csv(links_path)

    # Merge movies and links
    print("Merging dataframes...")
    df = pd.merge(movies_df, links_df, on='movieId', how='left')

    # Get all unique genres first
    print("Processing genres...")
    all_genres = set()
    for genres_str in df['genres']:
        genre_list = clean_genres(genres_str)
        all_genres.update(genre_list)

    genre_map = {}
    for genre_name in all_genres:
        if not genre_name: continue
        
        # Simple ID generation since we don't have TMDB genre IDs in csv
        # In a real app we'd fetch these from TMDB API
        # Here we hash the name or just use a counter? 
        # Let's just create if not exists using name as unique key
        
        # Check if exists
        genre = Genre.objects(name=genre_name).first()
        if not genre:
            # Generate a pseudo tmdb_id if needed, or just a random int
            # models.py requires tmdb_id. Let's make one up based on hash or just random
            import random
            fake_id = random.randint(1000, 999999)
            while Genre.objects(tmdb_id=fake_id).count() > 0:
                 fake_id = random.randint(1000, 999999)
                 
            genre = Genre(
                name=genre_name,
                tmdb_id=fake_id 
            )
            genre.save()
        genre_map[genre_name] = genre

    print(f"Found {len(genre_map)} genres.")

    # Process Movies
    print("Processing movies...")
    count = 0
    total = len(df)
    
    for _, row in df.iterrows():
        try:
            movie_id = row['movieId']
            tmdb_id = row['tmdbId']
            
            if pd.isna(tmdb_id):
                continue
                
            tmdb_id = int(tmdb_id)
            
            # Check if movie exists
            movie = Movie.objects(tmdb_id=tmdb_id).first()
            if not movie:
                movie = Movie(tmdb_id=tmdb_id)
            
            movie.movie_id = int(movie_id)
            movie.title = row['title']
            
            # Extract year from title if possible "Toy Story (1995)"
            import re
            match = re.search(r'\((\d{4})\)', row['title'])
            if match:
                movie.release_year = int(match.group(1))
                # clean title
                movie.title = row['title'].replace(f" ({match.group(1)})", "").strip()
            
            if not pd.isna(row['imdbId']):
                movie.imdb_id = str(int(row['imdbId'])).zfill(7) # IMDB IDs are usually 7 digits padded
            
            # Genres
            genre_list = clean_genres(row['genres'])
            movie.genres = [genre_map[g] for g in genre_list if g in genre_map]
            
            # Create a simple poster path placeholder or fetch it?
            # For now, we don't have it in CSV. We will handle dynamic fetching in frontend or update later.
            # But the model has 'poster_path'. Leave it empty for now.
            
            movie.popularity = 0.0 # Default
            movie.vote_average = 0.0
            movie.vote_count = 0
            
            movie.save()
            count += 1
            if count % 100 == 0:
                print(f"Processed {count}/{total} movies")
                
        except Exception as e:
            print(f"Error processing row {row.get('movieId', '?')}: {e}")
            continue

    print("Ingestion complete!")
    disconnect()

if __name__ == '__main__':
    ingest_data()
