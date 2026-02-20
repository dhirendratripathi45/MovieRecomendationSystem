
import pandas as pd
from pymongo import MongoClient
import os
import sys
from tqdm import tqdm

# Add current directory to path to import config
sys.path.append(os.getcwd())
from config import Config

def import_csv(file_path, collection_name, db):
    print(f"\nImporting {file_path} to collection '{collection_name}'...")
    
    # Check if collection already has data
    count = db[collection_name].count_documents({})
    if count > 0:
        print(f"Collection '{collection_name}' already has {count} documents. Skipping to avoid duplicates.")
        return

    # Use chunking for large files
    chunk_size = 100000
    
    # For large files, we need to handle potential memory issues
    # ratings.csv is ~620MB, which is fine for modern RAM but good to chunk
    try:
        reader = pd.read_csv(file_path, chunksize=chunk_size)
        
        # Estimate total rows for tqdm
        if 'ratings.csv' in file_path:
            total_rows = 22884379
        elif 'tags.csv' in file_path:
            total_rows = 586996
        elif 'links.csv' in file_path:
            total_rows = 34210
        else:
            total_rows = None
            
        total_chunks = (total_rows // chunk_size) + 1 if total_rows else None

        for chunk in tqdm(reader, total=total_chunks, desc=collection_name):
            # Convert dataframe to list of dictionaries
            # Handle NaN values which MongoDB doesn't like (convert to None)
            data = chunk.where(pd.notnull(chunk), None).to_dict('records')
            db[collection_name].insert_many(data)
            
        print(f"Successfully imported '{collection_name}'.")
    except Exception as e:
        print(f"Error importing {collection_name}: {e}")

def main():
    print("Connecting to MongoDB...")
    try:
        # Use settings from config.py
        client = MongoClient(
            host=Config.MONGODB_SETTINGS['host'],
            port=Config.MONGODB_SETTINGS['port']
        )
        # Access the database
        db_name = Config.MONGODB_SETTINGS['db']
        db = client[db_name]
        print(f"Connected to database: {db_name}")

        base_path = os.getcwd()
        dataset_path = os.path.join(base_path, 'dataset')
        
        files_to_import = [
            ('links.csv', 'links'),
            ('ratings.csv', 'ratings'),
            ('tags.csv', 'tags')
        ]

        for filename, col_name in files_to_import:
            file_path = os.path.join(dataset_path, filename)
            if os.path.exists(file_path):
                import_csv(file_path, col_name, db)
            else:
                print(f"File {file_path} not found in {dataset_path}")

        print("\nAll imports finished!")
    except Exception as e:
        print(f"Connection error: {e}")

if __name__ == "__main__":
    main()
