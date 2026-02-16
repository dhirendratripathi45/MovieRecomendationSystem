from flask import Blueprint, jsonify, request
from models import Movie, User, Genre
from datetime import datetime
from recommendation.routes import ensure_poster
import os
import json
from werkzeug.utils import secure_filename
import re

admin_bp = Blueprint('admin', __name__)

# --- Stats & Overview ---
@admin_bp.route('/stats', methods=['GET'])
def get_stats():
    try:
        from models import Watchlist, RatedMovie # Import here to avoid circular imports if any
        
        user_count = User.objects.count()
        movie_count = Movie.objects.count()
        
        # Total Ratings
        total_ratings = RatedMovie.objects.count()
        
        # Total Watchlist Items
        total_watchlist = Watchlist.objects.count()
        
        # Calculate total views
        total_views = 0
        try:
             pipeline = [{"$group": {"_id": None, "total": {"$sum": "$view_count"}}}]
             res = list(Movie.objects.aggregate(*pipeline))
             if res:
                 total_views = res[0]['total']
        except:
            total_views = 0

        # Helper to fetch movies from aggregation results
        def get_movies_from_agg(agg_results, id_field='_id', metric_field=None, metric_name=None):
            movies = []
            for item in agg_results:
                movie = Movie.objects(movie_id=item[id_field]).first()
                # Try tmdb_id if movie_id fails (legacy compatibility)
                if not movie:
                     movie = Movie.objects(tmdb_id=item[id_field]).first()
                if movie:
                    m_dict = movie.to_dict()
                    if metric_field and metric_name:
                         m_dict[metric_name] = item[metric_field]
                    movies.append(m_dict)
            return movies

        # 1. Trending (Most Watchlisted) - Dynamic
        try:
            pipeline = [
                {"$group": {"_id": "$movie_id", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 5}
            ]
            trending_agg = list(Watchlist.objects.aggregate(*pipeline))
            trending_movies_list = get_movies_from_agg(trending_agg, id_field='_id', metric_field='count', metric_name='watchlist_count')
        except Exception as e:
            print(f"Trending agg error: {e}")
            trending_movies_list = []

        # If no watchlist data, fallback to static trending
        if not trending_movies_list:
             trending_movies_list = [m.to_dict() for m in Movie.objects(is_trending=True).limit(5)]

        # 2. Highest Rated (Average Score) - Dynamic
        try:
            pipeline = [
                {"$group": {"_id": "$movie_id", "avg_score": {"$avg": "$score"}}},
                {"$sort": {"avg_score": -1}},
                {"$limit": 5}
            ]
            highest_rated_agg = list(RatedMovie.objects.aggregate(*pipeline))
            highest_rated_movies_list = get_movies_from_agg(highest_rated_agg, id_field='_id', metric_field='avg_score', metric_name='vote_average')
            
            # Format score to 1 decimal
            for m in highest_rated_movies_list:
                if 'vote_average' in m and isinstance(m['vote_average'], float):
                    m['vote_average'] = round(m['vote_average'], 1)
        except Exception as e:
             print(f"Highest rated agg error: {e}")
             highest_rated_movies_list = []

        # 3. Most Rated (Count) - Dynamic
        try:
            pipeline = [
                {"$group": {"_id": "$movie_id", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": 5}
            ]
            most_rated_agg = list(RatedMovie.objects.aggregate(*pipeline))
            most_rated_movies_list = get_movies_from_agg(most_rated_agg, id_field='_id', metric_field='count', metric_name='vote_count')
        except Exception as e:
            print(f"Most rated agg error: {e}")
            most_rated_movies_list = []
            
        # 4. Top Viewed - Still from Movie model (assuming view_count is incremented there)
        top_viewed_movies = Movie.objects.order_by('-view_count').limit(5)

        # Most watchlisted (Single movie for top highlight)
        most_watchlisted_title = "N/A"
        if trending_movies_list:
            most_watchlisted_title = trending_movies_list[0]['title']

        return jsonify({
            'users': user_count,
            'movies': movie_count,
            'reviews': total_ratings, 
            'watchlist_count': total_watchlist,
            'views': total_views,
            'trending': trending_movies_list,
            'highest_rated': highest_rated_movies_list,
            'top_viewed': [m.to_dict() for m in top_viewed_movies],
            'most_rated': most_rated_movies_list,
            'most_watchlisted': most_watchlisted_title
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- Movie Management ---
@admin_bp.route('/movies', methods=['GET'])
def get_movies():
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        search = request.args.get('search', '')
        is_trending = request.args.get('is_trending')
        is_arriving_soon = request.args.get('is_arriving_soon')
        sort_by = request.args.get('sort_by', 'newest') # newest, oldest, title
        
        # Build Query
        query = Movie.objects
        
        if search:
            query = query.filter(title__icontains=search)
            
        if is_trending == 'true':
            query = query.filter(is_trending=True)
        elif is_trending == 'false':
            query = query.filter(is_trending=False)
            
        if is_arriving_soon == 'true':
            query = query.filter(is_arriving_soon=True)
        elif is_arriving_soon == 'false':
            query = query.filter(is_arriving_soon=False)
            
        # Sorting
        if sort_by == 'newest':
            query = query.order_by('-created_at')
        elif sort_by == 'oldest':
            query = query.order_by('created_at')
        elif sort_by == 'title':
            query = query.order_by('title')
        elif sort_by == 'year':
            query = query.order_by('-release_year')
            
        # Pagination
        total = query.count()
        movies = query.skip((page-1)*limit).limit(limit)
            
        return jsonify({
            'movies': [m.to_dict() for m in movies],
            'total': total,
            'page': page,
            'pages': (total // limit) + 1
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/movies', methods=['POST'])
def add_movie():
    try:
        # Support only Form Data (for files)
        if request.content_type and request.content_type.startswith('multipart/form-data'):
            data = request.form.to_dict()
            # Form data strings to appropriate types
            if 'genres' in data:
                try:
                    data['genres'] = json.loads(data['genres'])
                except:
                    import ast
                    try:
                         # Fallback for some frontend sending formats
                         data['genres'] = ast.literal_eval(data['genres'])
                    except:
                         data['genres'] = []
            
            # Convert string booleans from form data
            data['is_trending'] = data.get('is_trending') == 'true'
            data['is_arriving_soon'] = data.get('is_arriving_soon') == 'true'
            data['release_year'] = int(data.get('release_year', datetime.now().year))
        else:
            return jsonify({'error': 'Multipart form data required'}), 400

        print(f"Adding movie with data: {data}")
        
        if not data.get('title'):
             return jsonify({'error': 'Title is required'}), 400
             
        # Handle Poster File Upload
        poster_path = None
        if 'poster_file' in request.files:
            file = request.files['poster_file']
            if file and file.filename:
                filename = secure_filename(f"{datetime.now().timestamp()}_{file.filename}")
                # Ensure static/uploads exists
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                upload_dir = os.path.join(base_dir, 'static', 'uploads')
                if not os.path.exists(upload_dir):
                    os.makedirs(upload_dir)
                    
                full_path = os.path.join(upload_dir, filename)
                file.save(full_path)
                # Store path relative to server root. 
                # Note: Frontend needs to prepend API URL if it's relative, or we serve it directly.
                # Usually we return a relative path and frontend handles it, or we return full URL.
                # For now keeping it relative as /static/uploads/...
                poster_path = f"/static/uploads/{filename}"
        
        if not poster_path:
             return jsonify({'error': 'Poster image is required (local file only)'}), 400

        # Generate tmdb_id since we removed it from UI
        import random
        tmdb_id = random.randint(1000000, 9999999)
        while Movie.objects(tmdb_id=tmdb_id).first():
            tmdb_id = random.randint(1000000, 9999999)
        
        # Ensure movie_id
        max_movie = Movie.objects.order_by('-movie_id').first()
        movie_id = (max_movie.movie_id + 1) if max_movie and max_movie.movie_id else random.randint(100000, 999999)

        # Generate unique imdb_id to avoid duplicate null error
        imdb_id = f"tt{random.randint(1000000, 9999999)}"
        while Movie.objects(imdb_id=imdb_id).first():
            imdb_id = f"tt{random.randint(1000000, 9999999)}"

        genre_names = data.get('genres', [])
        # Provide both full objects and list of names for compatibility
        genre_objs = list(Genre.objects(name__in=genre_names))

        movie = Movie(
            tmdb_id=tmdb_id,
            movie_id=movie_id,
            imdb_id=imdb_id,
            title=data['title'],
            overview=data.get('overview'),
            release_year=int(data.get('release_year', datetime.now().year)),
            genres=genre_objs,
            genres_list=genre_names,
            poster_path=poster_path,
            is_trending=data.get('is_trending', False),
            is_arriving_soon=data.get('is_arriving_soon', False),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        movie.save()
        print(f"Movie saved successfully: {movie.title} with path {poster_path}")
        
        return jsonify({'message': 'Movie added successfully', 'movie': movie.to_dict()}), 201
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/movies/<id>', methods=['PUT'])
def update_movie(id):
    try:
        movie = Movie.objects(id=id).first()
        if not movie:
            return jsonify({'error': 'Movie not found'}), 404

        data = {}
        if request.content_type and request.content_type.startswith('multipart/form-data'):
            data = request.form.to_dict()
            # Handle potential file upload
            if 'poster_file' in request.files:
                file = request.files['poster_file']
                if file and file.filename:
                    filename = secure_filename(f"{datetime.now().timestamp()}_{file.filename}")
                    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                    upload_dir = os.path.join(base_dir, 'static', 'uploads')
                    if not os.path.exists(upload_dir):
                        os.makedirs(upload_dir)
                    full_path = os.path.join(upload_dir, filename)
                    file.save(full_path)
                    movie.poster_path = f"/static/uploads/{filename}"
            
            # Handle boolean strings
            if 'is_trending' in data:
                 movie.is_trending = data['is_trending'] == 'true'
            if 'is_arriving_soon' in data:
                 movie.is_arriving_soon = data['is_arriving_soon'] == 'true'
            
            # Handle genres
            if 'genres' in data:
                try:
                    genre_names = json.loads(data['genres'])
                except:
                    genre_names = []
                movie.genres_list = genre_names
                movie.genres = list(Genre.objects(name__in=genre_names))
        
        else:
            data = request.get_json() or {}
            if 'is_trending' in data: movie.is_trending = data['is_trending']
            if 'is_arriving_soon' in data: movie.is_arriving_soon = data['is_arriving_soon']
            if 'genres' in data:
                # Expecting list of strings from JSON
                 movie.genres_list = data['genres']
                 movie.genres = list(Genre.objects(name__in=data['genres']))

        # Common fields
        if 'title' in data: movie.title = data['title']
        if 'overview' in data: movie.overview = data['overview']
        if 'release_year' in data: movie.release_year = int(data['release_year'])

        movie.updated_at = datetime.utcnow()
        movie.save()
        return jsonify({'message': 'Movie updated', 'movie': movie.to_dict()})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/movies/<id>', methods=['DELETE'])
def delete_movie(id):
    try:
        movie = Movie.objects(id=id).first()
        if not movie:
            return jsonify({'error': 'Movie not found'}), 404
        movie.delete()
        return jsonify({'message': 'Movie deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# --- User Management ---
@admin_bp.route('/users', methods=['GET'])
def get_users():
    try:
        search = request.args.get('search', '')
        if search:
            users = User.objects(__raw__={
                '$or': [
                    {'username': {'$regex': search, '$options': 'i'}},
                    {'email': {'$regex': search, '$options': 'i'}}
                ]
            })
        else:
            users = User.objects.all()
        return jsonify([u.to_dict() for u in users])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/users/<id>', methods=['GET'])
def get_user_details(id):
    try:
        user = User.objects(id=id).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get watchlist
        from models import Watchlist
        watchlist = Watchlist.objects(user=user)
        
        user_data = user.to_dict()
        user_data['watchlist'] = [w.to_dict() for w in watchlist]
        # ratings are already in user model as EmbeddedDocument
        user_data['ratings_count'] = len(user.ratings) if user.ratings else 0
        
        return jsonify(user_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@admin_bp.route('/activity', methods=['GET'])
def get_activity():
    try:
        # Fetch latest users
        new_users = User.objects.order_by('-created_at').limit(5)
        # Fetch latest movies
        new_movies = Movie.objects.order_by('-id').limit(5) # Assuming ID or created_at if we had it. We have created_at in model?
        # Model has created_at
        new_movies = Movie.objects.order_by('-created_at').limit(5)
        
        activity = []
        for u in new_users:
            activity.append({
                'id': f'user_{u.id}',
                'text': f'New user joined: {u.username}',
                'time': u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else 'Recently',
                'type': 'user',
                'icon': '👤'
            })
            
        for m in new_movies:
            activity.append({
                'id': f'movie_{m.id}',
                'text': f'Movie added: {m.title}',
                'time': m.created_at.strftime("%Y-%m-%d %H:%M") if m.created_at else 'Recently',
                'type': 'movie',
                'icon': '🎬'
            })
            
        # Sort by time descend (mocking sort as string sort might be roughly ok or just mix them)
        # Real impl would parse dates.
        return jsonify(activity)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

