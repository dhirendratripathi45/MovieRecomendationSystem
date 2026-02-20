from flask import Blueprint, jsonify, request
from utils.model_loader import ModelLoader
from sklearn.metrics.pairwise import linear_kernel
import pandas as pd
import numpy as np
import re
import requests
from config import Config
from models import Movie, Genre, User, UserRating, RatedMovie
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import threading

recommendation_bp = Blueprint('recommendation', __name__)
loader = ModelLoader()

from extensions import cache

def fetch_and_save_poster(movie_id, tmdb_id):
    """Background task to fetch poster"""
    try:
        from app import create_app
        app = create_app()
        with app.app_context():
            movie = Movie.objects(id=movie_id).first()
            if not movie: return
            
            # Try TMDB First
            api_key = Config.TMDB_API_KEY
            if api_key:
                url = f"{Config.TMDB_BASE_URL}/movie/{tmdb_id}?api_key={api_key}"
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    if data.get('poster_path'):
                        movie.poster_path = data.get('poster_path')
                        movie.save()
                        return

            # Fallback to OMDB
            omdb_key = "3fe0a4a2"
            omdb_url = f"http://www.omdbapi.com/?apikey={omdb_key}&t={movie.title}"
            try:
                omdb_res = requests.get(omdb_url, timeout=5)
                if omdb_res.status_code == 200:
                    omdb_data = omdb_res.json()
                    if omdb_data.get('Poster') and omdb_data['Poster'] != 'N/A':
                        movie.poster_path = omdb_data['Poster']
                        movie.save()
            except Exception as omdb_e:
                print(f"OMDB fetch error: {omdb_e}")
    except Exception as e:
        print(f"Background poster fetch error: {e}")

def ensure_poster(movie):
    """Checks if movie has a poster, if not, triggers background fetch."""
    # Only fetch if poster is missing or invalid AND we have a tmdb_id
    if (not movie.poster_path or movie.poster_path == 'nan' or 'null' in str(movie.poster_path)) and movie.tmdb_id:
        # Don't block. Start a thread.
        # Note: In production with uWSGI/Gunicorn this might need Celery, but for this app threads are essentially fine.
        # actually, for list views, we should just NOT fetch. only fetch on detail view?
        # or just let the frontend handle the fallback and we lazily update in background.
        thread = threading.Thread(target=fetch_and_save_poster, args=(str(movie.id), movie.tmdb_id))
        thread.start()

@recommendation_bp.route('/all', methods=['GET'])
def get_all_movies():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        genre = request.args.get('genre')
        country = request.args.get('country')
        search = request.args.get('search')
        
        query = Movie.objects
        
        if genre and genre != 'All':
            # Find genre object
            query = query(genres_list__icontains=genre)
            
        if country and country != 'All':
            if country == 'India':
                from mongoengine.queryset.visitor import Q
                # Match India in production countries, or Hindi language, or 'Bollywood' in title
                query = query(Q(production_countries__icontains='India') | Q(original_language='hi') | Q(title__icontains='Bollywood'))
            else:
                # For other countries, use direct production_country match
                query = query(production_countries__icontains=country)
            
        if search:
            query = query(title__icontains=search)
            
        total = query.count()
        movies = query.skip((page - 1) * limit).limit(limit)
        
        # Trigger background poster checks for these movies (DISABLED for speed)
        # for m in movies:
        #     ensure_poster(m)
            
        return jsonify({
            'movies': [m.to_dict() for m in movies],
            'total': total,
            'page': page,
            'pages': (total // limit) + 1
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@recommendation_bp.route('/collaborative/<user_id>', methods=['GET'])
def recommend_collaborative(user_id):
    try:
        user_id = int(user_id)
        knn, user_item_matrix, movie_mapper, movie_inv_mapper, user_mapper = loader.get_collaborative_model()
        
        if knn is None:
            return jsonify({'error': 'Model not loaded'}), 500

        # Logic for User Recommendation
        user = User.objects(id=str(user_id)).first() 
        
        live_ratings = {}
        if user and user.ratings:
            for r in user.ratings:
                live_ratings[r.movie_id] = r.score
                
        recommendations = {}
        
        # Top 5 recent favorites
        sorted_live = sorted(live_ratings.items(), key=lambda x: x[1], reverse=True)[:5] 
        
        if not sorted_live:
             # Fallback to trending if no ratings
             return recommend_trending()
             
        for m_id, score in sorted_live:
            if m_id in movie_mapper:
                idx = movie_mapper[m_id]
                m_vec = user_item_matrix.getrow(idx)
                distances, indices = knn.kneighbors(m_vec, n_neighbors=6)
                
                for i in range(1, len(indices[0])):
                    neighbor_idx = indices[0][i]
                    if neighbor_idx in movie_inv_mapper:
                        n_id = movie_inv_mapper[neighbor_idx]
                        if n_id not in live_ratings:
                            recommendations[n_id] = recommendations.get(n_id, 0) + score 
                            
        sorted_recs = sorted(recommendations.items(), key=lambda x: x[1], reverse=True)[:20]
        rec_ids = [rid for rid, _ in sorted_recs]
        
        movies = Movie.objects(movie_id__in=rec_ids)
        movie_map = {m.movie_id: m for m in movies}
        
        rec_list = []
        for mid, score in sorted_recs:
             if mid in movie_map:
                 movie_obj = movie_map[mid]
                 # ensure_poster(movie_obj)
                 d = movie_obj.to_dict()
                 d['match_score'] = min(98, int(score * 10) + 50) 
                 rec_list.append(d)
                 
        return jsonify(rec_list)

    except Exception as e:
        print(f"Collaborative recommendation error: {e}")
        return jsonify({'error': str(e)}), 500

@recommendation_bp.route('/hybrid/<user_id>', methods=['GET'])
@jwt_required(optional=True)
def recommend_hybrid(user_id):
    """
    Mathematical Hybrid Recommendation:
    Calculates a combined score using both Collaborative (KNN) and Content-Based (TF-IDF) scores.
    Formula: Final Score = (W_collab * Collab_Score) + (W_content * Content_Score)
    """
    try:
        # 1. Setup Weights
        # Default weights, could be customized per user or system settings
        w_collab = 0.6
        w_content = 0.4
        
        user = User.objects(id=str(user_id)).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        ratings_dict = {r.movie_id: r.score for r in user.ratings}
        if not ratings_dict:
            return recommend_trending()

        # 2. Get Collaborative Scores (KNN)
        knn, user_item_matrix, movie_mapper, movie_inv_mapper, _ = loader.get_collaborative_model()
        collab_scores = {}
        
        # Take user's top 5 rated movies to find neighbors
        sorted_user_ratings = sorted(ratings_dict.items(), key=lambda x: x[1], reverse=True)[:5]
        
        for mid, score in sorted_user_ratings:
            if mid in movie_mapper:
                idx = movie_mapper[mid]
                distances, indices = knn.kneighbors(user_item_matrix.getrow(idx), n_neighbors=10)
                for i in range(1, len(indices[0])):
                    neighbor_mid = movie_inv_mapper.get(indices[0][i])
                    if neighbor_mid and neighbor_mid not in ratings_dict:
                        # Normalize score (distances are 0 to 1, where 0 is most similar)
                        # We use (1 - distance) * user_rating
                        collab_scores[neighbor_mid] = collab_scores.get(neighbor_mid, 0) + (1 - distances[0][i]) * score

        # 3. Get Content Scores (TF-IDF)
        tfidf_matrix, content_indices = loader.get_content_model()
        inv_content_indices = loader.get_content_inv_indices()
        content_scores = {}
        
        for mid, score in sorted_user_ratings:
            if mid in content_indices:
                idx = content_indices[mid]
                query_vec = tfidf_matrix[idx]
                cosine_sim = linear_kernel(query_vec, tfidf_matrix).flatten()
                
                # Get top 10 similar movies
                similar_indices = cosine_sim.argsort()[:-12:-1]
                for si in similar_indices:
                    sim_mid = inv_content_indices.get(si)
                    if sim_mid and sim_mid != mid and sim_mid not in ratings_dict:
                        # cosine_sim[si] is the similarity score (0 to 1)
                        content_scores[sim_mid] = content_scores.get(sim_mid, 0) + cosine_sim[si] * score

        # 4. Mathematically Combine Scores
        all_candidate_ids = set(collab_scores.keys()) | set(content_scores.keys())
        final_recs = []
        
        # Normalization factors (to bring both onto similar scales)
        max_collab = max(collab_scores.values()) if collab_scores else 1
        max_content = max(content_scores.values()) if content_scores else 1

        for mid in all_candidate_ids:
            # Normalized individual scores
            norm_collab = collab_scores.get(mid, 0) / max_collab
            norm_content = content_scores.get(mid, 0) / max_content
            
            # Hybrid Calculation
            hybrid_score = (w_collab * norm_collab) + (w_content * norm_content)
            final_recs.append((mid, hybrid_score))

        # 5. Sort and Fetch Movie Details
        final_recs.sort(key=lambda x: x[1], reverse=True)
        top_ids = [rid for rid, _ in final_recs[:20]]
        
        movies = Movie.objects(movie_id__in=top_ids)
        movie_map = {m.movie_id: m for m in movies}
        
        results = []
        for mid, score in final_recs[:20]:
            if mid in movie_map:
                m_obj = movie_map[mid]
                ensure_poster(m_obj)
                d = m_obj.to_dict()
                # Map hybrid score (roughly 0 to 1) to a readable percentage (50-98%)
                d['match_score'] = int(min(98, (score * 40) + 50))
                d['algorithm'] = 'hybrid'
                results.append(d)
        
        return jsonify(results)

    except Exception as e:
        print(f"Hybrid recommendation error: {e}")
        return jsonify({'error': str(e)}), 500

@recommendation_bp.route('/content/<movie_title>', methods=['GET'])
def recommend_content(movie_title):
    try:
        tfidf, indices = loader.get_content_model()
        
        if tfidf is None:
            return jsonify({'error': 'Model not loaded'}), 500
            
        movie = Movie.objects(title__icontains=movie_title).first()
        if not movie:
             return jsonify({'message': 'Movie not found'}), 404
             
        # Check if movie_id is in our indices map
        if movie.movie_id not in indices:
             # Try finding by title text in the keys? No, indices keys are IDs usually.
             return jsonify({'message': 'Movie not in content model'}), 404
             
        idx = indices[movie.movie_id]

        query_vec = tfidf[idx]
        cosine_scores = linear_kernel(query_vec, tfidf).flatten()
        
        sim_scores = list(enumerate(cosine_scores))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        sim_scores = sim_scores[1:11] 
        
        inv_indices = loader.get_content_inv_indices()
        
        rec_data = []
        rec_ids = []
        for i, score in sim_scores:
            if i in inv_indices:
                mid = inv_indices[i]
                rec_ids.append(mid)
                rec_data.append({'movie_id': mid, 'score': float(score)})
                
        movies = Movie.objects(movie_id__in=rec_ids)
        movie_map = {m.movie_id: m for m in movies}
        
        results = []
        for item in rec_data:
            mid = item['movie_id']
            if mid in movie_map:
                movie_obj = movie_map[mid]
                ensure_poster(movie_obj)
                
                m_dict = movie_obj.to_dict()
                match_pct = int(item['score'] * 100)
                if match_pct > 99: match_pct = 99
                if match_pct < 50: match_pct += 40 
                
                m_dict['match_score'] = match_pct
                results.append(m_dict)
                
        return jsonify(results)

    except Exception as e:
        print(f"Content recommendation error: {e}")
        return jsonify({'error': str(e)}), 500

@recommendation_bp.route('/trending', methods=['GET'])
@cache.cached(timeout=600)
def recommend_trending():
    try:
        limit = 20
        admin_trending = list(Movie.objects(is_trending=True).order_by('-updated_at').limit(limit))
        
        needed = limit - len(admin_trending)
        
        if needed > 0:
            ids_exclude = [m.id for m in admin_trending]
            more_movies = Movie.objects(id__nin=ids_exclude).order_by('-release_year', '-movie_id').limit(needed)
            admin_trending.extend(list(more_movies))
            
         # for m in admin_trending:
        #     ensure_poster(m)
            
        return jsonify([m.to_dict() for m in admin_trending])
    except Exception as e:
         return jsonify({'error': str(e)}), 500

@recommendation_bp.route('/arriving-soon', methods=['GET'])
@cache.cached(timeout=600)
def recommend_arriving_soon():
    try:
        movies = Movie.objects(is_arriving_soon=True).order_by('-release_year', '-movie_id').limit(20)
        # for m in movies:
        #     ensure_poster(m)
        return jsonify([m.to_dict() for m in movies])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@recommendation_bp.route('/most-rated', methods=['GET'])
def recommend_most_rated():
    try:
        # Aggregate top rated movies by count
        pipeline = [
            {"$group": {"_id": "$movie_id", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        agg_results = list(RatedMovie.objects.aggregate(*pipeline))
        
        movies = []
        for item in agg_results:
            movie = Movie.objects(movie_id=item['_id']).first()
            if not movie:
                 movie = Movie.objects(tmdb_id=item['_id']).first()
            if movie:
                # ensure_poster(movie)
                m_dict = movie.to_dict()
                m_dict['vote_count_local'] = item['count'] # Add local vote count
                movies.append(m_dict)
                
        return jsonify(movies)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@recommendation_bp.route('/most-viewed', methods=['GET'])
def recommend_most_viewed():
    try:
        # Fetch top viewed movies (using 'Most Searched' proxy)
        movies = Movie.objects.order_by('-view_count').limit(10)
        # for m in movies:
        #     ensure_poster(m)
        return jsonify([m.to_dict() for m in movies])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@recommendation_bp.route('/genres', methods=['GET'])
@cache.cached(timeout=3600)
def get_genres():
    try:
        genres = Genre.objects.all()
        return jsonify([g.to_dict() for g in genres])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@recommendation_bp.route('/genres/<int:tmdb_genre_id>', methods=['GET'])
def get_movies_by_genre(tmdb_genre_id):
    try:
        genre = Genre.objects(tmdb_id=tmdb_genre_id).first()
        if not genre:
            return jsonify({'error': 'Genre not found'}), 404
        movies = Movie.objects(genres=genre).limit(20)
        
        # for m in movies:
        #     ensure_poster(m)
            
        return jsonify([m.to_dict() for m in movies])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@recommendation_bp.route('/rate', methods=['POST'])
@jwt_required()
def rate_movie():
    try:
        user_id = get_jwt_identity() 
        
        data = request.get_json()
        movie_id = data.get('movie_id') 
        score = data.get('score')
        
        user = User.objects(id=user_id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Update RatedMovie collection
        rated_movie = RatedMovie.objects(user=user, movie_id=movie_id).first()
        if rated_movie:
            rated_movie.score = score
            rated_movie.created_at = datetime.utcnow()
            rated_movie.save()
        else:
            rated_movie = RatedMovie(user=user, movie_id=movie_id, score=score)
            rated_movie.save()

        # Update User embedded ratings (Legacy/Backup)
        existing_rating = None
        for r in user.ratings:
            if r.movie_id == movie_id:
                existing_rating = r
                break
        
        if existing_rating:
            existing_rating.score = score
            existing_rating.timestamp = datetime.utcnow()
        else:
            new_rating = UserRating(movie_id=movie_id, score=score)
            user.ratings.append(new_rating)
            
        user.save()
        
        return jsonify({'message': 'Rating saved successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@recommendation_bp.route('/rated', methods=['GET'])
@jwt_required()
def get_user_rated_movies():
    try:
        user_id = get_jwt_identity()
        user = User.objects(id=user_id).first()
        if not user:
             return jsonify({'error': 'User not found'}), 404
             
        rated_movies = list(RatedMovie.objects(user=user).order_by('-created_at').limit(50))
        movie_ids = [rm.movie_id for rm in rated_movies]
        
        movies = Movie.objects(movie_id__in=movie_ids)
        movie_map = {m.movie_id: m for m in movies}
        
        results = []
        for rm in rated_movies:
            movie = movie_map.get(rm.movie_id)
            if movie:
                # Still trigger poster check, but it's background thread
                ensure_poster(movie)
                m_dict = movie.to_dict()
                m_dict['user_rating'] = rm.score
                m_dict['rated_at'] = rm.created_at
                results.append(m_dict)
                
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@recommendation_bp.route('/movie/<id>', methods=['GET'])
@cache.cached(timeout=300, query_string=True)
def get_movie_details(id):
    try:
        if len(id) == 24: 
             movie = Movie.objects(id=id).first()
        else:
             movie = Movie.objects(movie_id=int(id)).first()
             
        if not movie:
            return jsonify({'error': 'Movie not found'}), 404
            
        ensure_poster(movie)
        
        response_data = movie.to_dict()
        
        # Check for user rating
        try:
            from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            
            if user_id:
                user = User.objects(id=user_id).first()
                if user and user.ratings:
                    for r in user.ratings:
                        if r.movie_id == movie.movie_id:
                            response_data['user_rating'] = r.score
                            break
        except Exception as jwt_e:
            pass # Ignore if no token or invalid
             
        return jsonify(response_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
