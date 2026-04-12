
import os
import sys
import pandas as pd
from mongoengine import connect, disconnect
from datetime import datetime
import re
from tqdm import tqdm

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
    ratings_path = os.path.join(dataset_path, 'ratings.csv')

    print(f"Reading CSV files from {dataset_path}...")
    movies_df = pd.read_csv(movies_path)
    links_df = pd.read_csv(links_path)
    ratings_df = pd.read_csv(ratings_path) # Read ratings

    # Pre-process ratings to get vote_count and vote_average per movie
    print("Processing ratings...")
    movie_ratings_stats = ratings_df.groupby('movieId')['rating'].agg(['count', 'sum']).reset_index()
    movie_ratings_stats['average'] = movie_ratings_stats['sum'] / movie_ratings_stats['count']
    movie_ratings = movie_ratings_stats.set_index('movieId').to_dict(orient='index')

    # Merge movies and links
    print("Merging dataframes...")
    df = pd.merge(movies_df, links_df, on='movieId', how='left')

    # Filter invalid TMDB IDs
    df = df.dropna(subset=['tmdbId'])
    df['tmdbId'] = df['tmdbId'].astype(int)
    
    # Deduplicate by tmdbId (keep first occurrence)
    initial_count = len(df)
    df = df.drop_duplicates(subset=['tmdbId'])
    print(f"Removed {initial_count - len(df)} duplicate TMDB IDs.")

    # Clear existing
    print("Clearing existing Movies and Genres...")
    Movie.objects.delete()
    Genre.objects.delete()

    # Get all unique genres first
    print("Processing genres...")
    all_genres = set()
    for genres_str in df['genres']:
        genre_list = clean_genres(genres_str)
        all_genres.update(genre_list)

    genre_map = {}
    genre_id_counter = 100
    for genre_name in all_genres:
        if not genre_name: continue
        genre = Genre(
            name=genre_name,
            tmdb_id=genre_id_counter 
        )
        genre.save()
        genre_map[genre_name] = genre
        genre_id_counter += 1

    print(f"Created {len(genre_map)} genres.")

    # Pre-calculate trending/arriving soon IDs
    # Trending: Top 50 by vote_count
    # Arriving Soon: Top 50 by release_year (descending)
    
    # Extract year to sort
    def extract_year(title):
        match = re.search(r'\((\d{4})\)', str(title))
        return int(match.group(1)) if match else 0
    
    df['year'] = df['title'].apply(extract_year)
    
    # Map ratings to df
    print(f"Mapping ratings to {len(df)} movies...")
    def get_vote_count(mid):
        return movie_ratings.get(mid, {'count': 0})['count']
    
    def get_vote_average(mid):
        stats = movie_ratings.get(mid, {'count': 0, 'sum': 0.0, 'average': 0.0})
        return stats['average']

    df['vote_count_temp'] = df['movieId'].apply(get_vote_count)
    df['vote_average_temp'] = df['movieId'].apply(get_vote_average)
    
            # Process Movies
    print("Processing movies...")
    count = 0
    total = len(df)
    
    for _, row in tqdm(df.iterrows(), total=total, desc="Saving Movies"):
        try:
            movie_id = row['movieId']
            tmdb_id = row['tmdbId']
            
            movie = Movie(tmdb_id=tmdb_id)
            movie.movie_id = int(movie_id)
            movie.title = row['title'].strip()
            
            # Year extraction
            movie.release_year = row['year']
            if movie.release_year > 0:
                movie.title = row['title'].replace(f" ({movie.release_year})", "").strip()
            
            if not pd.isna(row['imdbId']):
                movie.imdb_id = str(int(row['imdbId'])).zfill(7)
            
            # Genres
            genre_list = clean_genres(row['genres'])
            movie.genres = [genre_map[g] for g in genre_list if g in genre_map]
            movie.genres_list = genre_list
            
            # Ratings from mapped columns
            movie.vote_count = int(row['vote_count_temp'])
            movie.vote_average = float(row['vote_average_temp'])
            movie.popularity = float(movie.vote_count)

            # Manual override: Flags are now False by default and set via admin panel
            movie.is_trending = False
            movie.is_arriving_soon = False
                
            movie.save()
            count += 1
                
        except Exception as e:
            # print(f"Error processing row {row.get('movieId', '?')}: {e}")
            continue

    print(f"Ingested {count} movies.")

    print("Ingestion complete!")
    disconnect()

if __name__ == '__main__':
    ingest_data()
