import os
import pandas as pd
from sklearn.model_selection import train_test_split

def split_data():
    # Define paths
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_dir = os.path.join(base_dir, 'dataset')
    ratings_path = os.path.join(dataset_dir, 'ratings.csv')
    
    # Check if file exists
    if not os.path.exists(ratings_path):
        print(f"Error: {ratings_path} not found.")
        return

    # Load data
    print("Loading data...")
    ratings = pd.read_csv(ratings_path)
    
    # Basic cleaning (if necessary)
    # ratings.dropna(inplace=True) 

    # Split data
    print("Splitting data...")
    train_data, test_data = train_test_split(ratings, test_size=0.2, random_state=42)

    # Save splits
    train_path = os.path.join(dataset_dir, 'train.csv')
    test_path = os.path.join(dataset_dir, 'test.csv')
    
    train_data.to_csv(train_path, index=False)
    test_data.to_csv(test_path, index=False)
    
    print(f"Data split successful!")
    print(f"Training set: {len(train_data)} rows saved to {train_path}")
    print(f"Testing set: {len(test_data)} rows saved to {test_path}")

if __name__ == "__main__":
    split_data()
