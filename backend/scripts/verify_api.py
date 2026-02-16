import requests
import sys

BASE_URL = "http://localhost:5000/api"

def test_endpoints():
    print("Testing Backend Endpoints...")
    
    # 1. Health
    try:
        r = requests.get(f"{BASE_URL}/health")
        print(f"Health: {r.status_code}")
    except Exception as e:
        print(f"Health Check Failed: {e}")
        return

    # 2. Trending
    try:
        r = requests.get(f"{BASE_URL}/recommend/trending")
        if r.status_code == 200:
            data = r.json()
            print(f"Trending: OK (Count: {len(data)})")
        else:
            print(f"Trending: Failed ({r.status_code}) - {r.text}")
    except Exception as e:
        print(f"Trending Failed: {e}")

    # 3. Genres
    try:
        r = requests.get(f"{BASE_URL}/recommend/genres")
        if r.status_code == 200:
            data = r.json()
            print(f"Genres: OK (Count: {len(data)})")
            if len(data) > 0:
                genre_id = data[0]['tmdb_id']
                # 4. Movies by Genre
                r2 = requests.get(f"{BASE_URL}/recommend/genres/{genre_id}")
                if r2.status_code == 200:
                    print(f"Movies by Genre ({genre_id}): OK (Count: {len(r2.json())})")
                else:
                    print(f"Movies by Genre: Failed ({r2.status_code})")
        else:
            print(f"Genres: Failed ({r.status_code})")
    except Exception as e:
        print(f"Genres Failed: {e}")

if __name__ == "__main__":
    test_endpoints()
