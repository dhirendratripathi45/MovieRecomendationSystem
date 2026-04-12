
import os
import pandas as pd
import pickle
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.neighbors import NearestNeighbors
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

def train_models():
    # Define paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_dir = os.path.join(base_dir, 'dataset')
    models_dir = os.path.join(base_dir, 'models')
    
    if not os.path.exists(models_dir):
        os.makedirs(models_dir)
    
    train_path = os.path.join(dataset_dir, 'ratings.csv') # Using full ratings for now, or split if exists
    # Ideally should use train.csv from data_split.py if available, but let's default to ratings.csv
    # if train.csv exists, use it.
    if os.path.exists(os.path.join(dataset_dir, 'train.csv')):
        train_path = os.path.join(dataset_dir, 'train.csv')
        
    movies_path = os.path.join(dataset_dir, 'movies.csv')
    tags_path = os.path.join(dataset_dir, 'tags.csv')
    
    # Check if files exist
    if not os.path.exists(train_path):
        print(f"Error: {train_path} not found.")
        return
    if not os.path.exists(movies_path):
        print(f"Error: {movies_path} not found.")
        return

    # Load data
    print("Loading data...")
    # Read ratings (columns: userId, movieId, rating, timestamp)
    train_data = pd.read_csv(train_path)
    movies_data = pd.read_csv(movies_path)
    
    # Load tags if available
    tags_data = pd.DataFrame()
    if os.path.exists(tags_path):
        print("Loading tags...")
        tags_data = pd.read_csv(tags_path)
        # Aggregate tags by movieId
        # Ensure it's string first
        tags_data['tag'] = tags_data['tag'].fillna('').astype(str)
        tags_grouped = tags_data.groupby('movieId')['tag'].apply(lambda x: ' '.join(x)).reset_index()
        # Merge with movies
        movies_data = pd.merge(movies_data, tags_grouped, on='movieId', how='left')
        movies_data['tag'] = movies_data['tag'].fillna('')
    else:
        print("Warning: tags.csv not found. proceeding without tags.")
        movies_data['tag'] = ''

    # --- Collaborative Filtering (Item-Item) ---
    print("Training Collaborative Filtering model...")
    
    # Map IDs to continuous indices
    train_data['user_idx'] = train_data['userId'].astype("category").cat.codes
    train_data['movie_idx'] = train_data['movieId'].astype("category").cat.codes
    
    # Create mappers
    user_mapper = dict(zip(train_data['userId'], train_data['user_idx']))
    movie_mapper = dict(zip(train_data['movieId'], train_data['movie_idx']))
    movie_inv_mapper = dict(zip(train_data['movie_idx'], train_data['movieId']))
    
    n_users = train_data['user_idx'].nunique()
    n_movies = train_data['movie_idx'].nunique()
    
    # Create Sparse Matrix directly
    # Rows: Movies, Cols: Users (Item-Item)
    user_item_matrix_sparse = csr_matrix(
        (train_data['rating'], (train_data['movie_idx'], train_data['user_idx'])),
        shape=(n_movies, n_users)
    )
    
    # Train KNN model
    knn_model = NearestNeighbors(metric='cosine', algorithm='brute', n_neighbors=20, n_jobs=-1)
    knn_model.fit(user_item_matrix_sparse)
    
    # Save CF artifacts
    with open(os.path.join(models_dir, 'collaborative_model.pkl'), 'wb') as f:
        pickle.dump(knn_model, f)
    
    with open(os.path.join(models_dir, 'user_item_matrix.pkl'), 'wb') as f:
        pickle.dump(user_item_matrix_sparse, f)
        
    with open(os.path.join(models_dir, 'movie_mapper.pkl'), 'wb') as f:
        pickle.dump(movie_mapper, f)
        
    with open(os.path.join(models_dir, 'movie_inv_mapper.pkl'), 'wb') as f:
        pickle.dump(movie_inv_mapper, f)
        
    with open(os.path.join(models_dir, 'user_mapper.pkl'), 'wb') as f:
        pickle.dump(user_mapper, f)

    print("Collaborative Filtering model trained and saved.")

    # --- Content-Based Filtering ---
    print("Training Content-Based Filtering model...")
    
    # Fill NaN genres with empty string
    movies_data['genres'] = movies_data['genres'].fillna('')
    
    # Preprocess genres
    movies_data['genres_str'] = movies_data['genres'].apply(lambda x: x.replace('|', ' '))
    
    # Combine Genres and Tags
    movies_data['content_features'] = movies_data['genres_str'] + ' ' + movies_data['tag']
    
    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(movies_data['content_features'])
    
    # Save TF-IDF matrix
    with open(os.path.join(models_dir, 'tfidf_matrix.pkl'), 'wb') as f:
        pickle.dump(tfidf_matrix, f)
        
    # Save indices map
    indices = pd.Series(movies_data.index, index=movies_data['movieId']).drop_duplicates()
    
    with open(os.path.join(models_dir, 'content_movie_indices.pkl'), 'wb') as f:
        pickle.dump(indices, f)
        
    print("Content-Based Filtering model (TF-IDF Matrix) trained and saved.")

if __name__ == "__main__":
    train_models()
