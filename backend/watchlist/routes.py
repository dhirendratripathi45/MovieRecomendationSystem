from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import User, Watchlist
from mongoengine.errors import ValidationError

watchlist_bp = Blueprint('watchlist', __name__)

@watchlist_bp.route('', methods=['GET'])
@jwt_required()
def get_watchlist():
    try:
        user_id = get_jwt_identity()
        user = User.objects.get(id=user_id)
        
        watchlist_items = list(Watchlist.objects(user=user).order_by('-created_at').limit(50))
        movie_ids = [item.movie_id for item in watchlist_items]
        
        from models import Movie
        movies = Movie.objects(movie_id__in=movie_ids)
        movie_map = {m.movie_id: m for m in movies}
        
        results = []
        for item in watchlist_items:
            movie = movie_map.get(item.movie_id)
            if movie:
                from recommendation.routes import ensure_poster
                ensure_poster(movie)
                results.append(movie.to_dict())
            else:
                # Fallback to what's in the watchlist record
                results.append(item.to_dict())
                
        return jsonify(results), 200
    except User.DoesNotExist:
        return jsonify({'message': 'User not found'}), 404
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@watchlist_bp.route('/add', methods=['POST'])
@jwt_required()
def add_to_watchlist():
    try:
        user_id = get_jwt_identity()
        user = User.objects.get(id=user_id)
        
        data = request.get_json()
        movie_id = data.get('movieId')
        title = data.get('title')
        genres = data.get('genres')
        tmdb_id = data.get('tmdbId')
        
        if not movie_id:
            return jsonify({'message': 'Movie ID is required'}), 400
            
        # Check if already in watchlist
        existing = Watchlist.objects(user=user, movie_id=movie_id).first()
        if existing:
            return jsonify({'message': 'Movie already in watchlist'}), 200
            
        new_item = Watchlist(
            user=user,
            movie_id=movie_id,
            title=title,
            genres='|'.join(genres) if isinstance(genres, list) else genres,
            tmdb_id=tmdb_id
        )
        new_item.save()
        
        return jsonify(new_item.to_dict()), 201
    except User.DoesNotExist:
        return jsonify({'message': 'User not found'}), 404
    except Exception as e:
        return jsonify({'message': str(e)}), 500

@watchlist_bp.route('/remove/<movie_id>', methods=['DELETE'])
@jwt_required()
def remove_from_watchlist(movie_id):
    try:
        user_id = get_jwt_identity()
        user = User.objects.get(id=user_id)
        
        # movie_id here is the CSV movieId (Int)
        try:
            movie_id_int = int(movie_id)
        except ValueError:
            return jsonify({'message': 'Invalid Movie ID'}), 400
            
        item = Watchlist.objects(user=user, movie_id=movie_id_int).first()
        if not item:
            return jsonify({'message': 'Item not found in watchlist'}), 404
            
        item.delete()
        return jsonify({'message': 'Removed from watchlist'}), 200
    except User.DoesNotExist:
        return jsonify({'message': 'User not found'}), 404
    except Exception as e:
        return jsonify({'message': str(e)}), 500
