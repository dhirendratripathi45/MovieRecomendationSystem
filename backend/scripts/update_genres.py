
import os
import sys
import pandas as pd
from mongoengine import connect

# Add backend directory to sys.path
sys.path.append(os.getcwd())

from models import Movie
from config import Config

def update_genres():
    print("Connecting to MongoDB...")
    connect(host=Config.MONGODB_SETTINGS['host'], port=Config.MONGODB_SETTINGS['port'], db=Config.MONGODB_SETTINGS['db'])
    
    csv_path = 'dataset/movies.csv'
    print(f"Reading {csv_path}...")
    
    if not os.path.exists(csv_path):
        print("CSV not found!")
        return

    df = pd.read_csv(csv_path)
    
    print("Updating movies...")
    count = 0
    for index, row in df.iterrows():
        try:
            genres_str = row['genres']
            if not genres_str: continue
            
            genres_list = genres_str.split('|')
            
            # Find movie by movieId
            movie = Movie.objects(movie_id=row['movieId']).first()
            if movie:
                movie.genres_list = genres_list
                movie.save()
                count += 1
                if count % 1000 == 0:
                    print(f"Updated {count} movies...")
        except Exception as e:
            print(f"Error on row {index}: {e}")
            
    print(f"Finished! Updated {count} movies.")

if __name__ == '__main__':
    update_genres()
