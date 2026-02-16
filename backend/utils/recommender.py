import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import os

# Load dataset
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_PATH = os.path.join(BASE_DIR, "dataset", "movies.csv")

df = pd.read_csv(CSV_PATH)

# Fill missing values
df.fillna("", inplace=True)

# Combine features
df["combined_features"] = df["genres"] + " " + df["overview"]

# Vectorization
vectorizer = TfidfVectorizer(stop_words="english")
tfidf_matrix = vectorizer.fit_transform(df["combined_features"])

# Similarity matrix
similarity = cosine_similarity(tfidf_matrix)

def recommend_movies(movie_title, top_n=5):
    if movie_title not in df["title"].values:
        return []

    idx = df[df["title"] == movie_title].index[0]
    scores = list(enumerate(similarity[idx]))
    scores = sorted(scores, key=lambda x: x[1], reverse=True)

    recommended = []
    for i in scores[1:top_n+1]:
        recommended.append(df.iloc[i[0]]["title"])

    return recommended
