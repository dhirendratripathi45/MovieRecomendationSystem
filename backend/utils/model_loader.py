import pickle
import os
import pandas as pd

class ModelLoader:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelLoader, cls).__new__(cls)
            cls._instance._load_models()
        return cls._instance
    
    def _load_models(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        models_dir = os.path.join(base_dir, 'models')
        dataset_dir = os.path.join(base_dir, 'dataset')
        
        print("Loading models...")
        
        # Initialize defaults to prevent AttributeErrors
        self.knn_model = None
        self.user_item_matrix = None
        self.movie_mapper = {}
        self.movie_inv_mapper = {}
        self.user_mapper = {}
        self.tfidf_matrix = None
        self.content_movie_indices = {}
        self.movies_df = pd.DataFrame()

        try:
            # Collaborative Filtering
            collab_path = os.path.join(models_dir, 'collaborative_model.pkl')
            if os.path.exists(collab_path):
                with open(collab_path, 'rb') as f:
                    self.knn_model = pickle.load(f)
                with open(os.path.join(models_dir, 'user_item_matrix.pkl'), 'rb') as f:
                    self.user_item_matrix = pickle.load(f)
                with open(os.path.join(models_dir, 'movie_mapper.pkl'), 'rb') as f:
                    self.movie_mapper = pickle.load(f)
                with open(os.path.join(models_dir, 'movie_inv_mapper.pkl'), 'rb') as f:
                    self.movie_inv_mapper = pickle.load(f)
                with open(os.path.join(models_dir, 'user_mapper.pkl'), 'rb') as f:
                    self.user_mapper = pickle.load(f)
                
            # Content-Based Filtering
            tfidf_path = os.path.join(models_dir, 'tfidf_matrix.pkl')
            if os.path.exists(tfidf_path):
                with open(tfidf_path, 'rb') as f:
                    self.tfidf_matrix = pickle.load(f)
                with open(os.path.join(models_dir, 'content_movie_indices.pkl'), 'rb') as f:
                    self.content_movie_indices = pickle.load(f)
                
                # Create inverse mapping for content indices: matrix_idx -> movieId (or title)
                # content_movie_indices usually maps Key -> Matrix Index
                self.content_inv_indices = {v: k for k, v in self.content_movie_indices.items()}
                
            print("Models loaded successfully.")
        except Exception as e:
            print(f"Error loading models: {e}")

    def get_collaborative_model(self):
        return self.knn_model, self.user_item_matrix, self.movie_mapper, self.movie_inv_mapper, self.user_mapper

    def get_content_model(self):
        return self.tfidf_matrix, self.content_movie_indices
        
    def get_content_inv_indices(self):
        return self.content_inv_indices

