
import sys
import os
import requests
import time
from tqdm import tqdm

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models import Movie
from config import Config
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def fetch_poster(movie, api_key):
    omdb_key = "3fe0a4a2"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    # Try TMDB First
    if api_key:
        url = f"{Config.TMDB_BASE_URL}/movie/{movie.tmdb_id}?api_key={api_key}"
        try:
            response = requests.get(url, headers=headers, timeout=10, verify=False)
            if response.status_code == 200:
                data = response.json()
                if data.get('poster_path'):
                    return data.get('poster_path')
        except Exception as e:
            print(f"TMDB Error fetching {movie.title}: {e}")
            
    # Try OMDB Fallback
    try:
        omdb_url = f"http://www.omdbapi.com/?apikey={omdb_key}&t={movie.title}"
        response = requests.get(omdb_url, headers=headers, timeout=10, verify=False)
        if response.status_code == 200:
            data = response.json()
            if data.get('Poster') and data['Poster'] != 'N/A':
                return data['Poster']
    except Exception as e:
        print(f"OMDB Error fetching {movie.title}: {e}")
        
    return None

def update_images():
    app = create_app()
    with app.app_context():
        trending = Movie.objects(is_trending=True)
        arriving = Movie.objects(is_arriving_soon=True)
        
        # Also most rated/viewed
        most_viewed = Movie.objects.order_by('-view_count').limit(50)
        # For most rated we'd need aggregation, let's just grab top 50 by vote_count (from ingestion)
        most_rated = Movie.objects.order_by('-vote_count').limit(50)
        
        movies_to_update = list(trending) + list(arriving) + list(most_viewed) + list(most_rated)
        unique_movies = {m.id: m for m in movies_to_update}.values()
        
        print(f"Updating images for {len(unique_movies)} priority movies...")
        
        api_key = Config.TMDB_API_KEY
        if not api_key:
            print("Error: TMDB_API_KEY not set in config/env. Cannot fetch images.")
            return

        count = 0
        for movie in tqdm(unique_movies, desc="Fetching Posters"):
            if not movie.poster_path:
                path = fetch_poster(movie, api_key)
                if path:
                    movie.poster_path = path
                    movie.save()
                    count += 1
                time.sleep(0.1) # Rate limit
                
        print(f"Updated {count} movies with new posters.")

if __name__ == "__main__":
    update_images()
