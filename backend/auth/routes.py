from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models import User, Movie
import re

auth_bp = Blueprint('auth', __name__)
bcrypt = Bcrypt()

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password required'}), 400
        
        # Check if user exists
        if User.objects(email=data['email']).first():
            return jsonify({'message': 'User already exists'}), 400
        
        # Create user
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        username = data.get('username') or data['email'].split('@')[0]
        
        user = User(
            email=data['email'],
            username=username,
            password_hash=hashed_password
        )
        
        # Save preferred genres if provided
        if 'genres' in data and isinstance(data['genres'], list):
            from models import UserPreference
            user.preferences = UserPreference(preferred_genres=data['genres'])
        
        user.save()
        
        # Create token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'User created',
            'user': user.to_dict(),
            'token': access_token
        }), 201
        
    except Exception as e:
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password required'}), 400
        
        # Find user
        user = User.objects(email=data['email']).first()
        
        if not user or not bcrypt.check_password_hash(user.password_hash, data['password']):
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Create token
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict(),
            'token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500

@auth_bp.route('/demo-login', methods=['POST'])
def demo_login():
    """Simple demo login without password"""
    try:
        # Create or get demo user
        demo_email = "demo@movierec.com"
        user = User.objects(email=demo_email).first()
        
        if not user:
            hashed_password = bcrypt.generate_password_hash('demo123').decode('utf-8')
            user = User(
                email=demo_email,
                username='DemoUser',
                password_hash=hashed_password
            )
            user.save()
        
        access_token = create_access_token(identity=str(user.id))
        
        return jsonify({
            'message': 'Demo login successful',
            'user': user.to_dict(),
            'token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Demo login failed', 'error': str(e)}), 500

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    try:
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()

        user = User.objects(id=current_user_id).first()
        if not user:
             return jsonify({'message': 'User not found'}), 404

        user_data = user.to_dict()
        
        # Populate rated movies
        rated_movies = []
        if user.ratings:
            # Get all movie IDs from ratings
            # ratings is a list of UserRating(movie_id, score, timestamp)
            # movie_id in UserRating corresponds to Movie.movie_id (int) based on models.py
            
            # Fetch all related movies in one query if possible
            # movie_ids = [r.movie_id for r in user.ratings]
            # movies = Movie.objects(movie_id__in=movie_ids)
            # But we need to map scores to them.
            
            for rating in user.ratings:
                 movie = Movie.objects(movie_id=rating.movie_id).first()
                 if movie:
                     # Check/Fetch poster if needed (optional, maybe slow if too many)
                     # ensure_poster(movie) 
                     
                     m_dict = movie.to_dict()
                     # Inject user score
                     m_dict['user_score'] = rating.score
                     # Ensure ID compatibility for Profile.jsx (it uses movie_id)
                     m_dict['movie_id'] = movie.movie_id 
                     rated_movies.append(m_dict)
        
        user_data['rated_movies'] = rated_movies
        return jsonify(user_data), 200

    except Exception as e:
        return jsonify({'message': 'Failed to fetch profile', 'error': str(e)}), 500

@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    try:
        data = request.get_json()
        
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        
        user = User.objects(id=current_user_id).first()
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        if 'username' in data:
            user.username = data['username']
        if 'email' in data:
            user.email = data['email']
        if 'profile_picture' in data:
            user.profile_picture = data['profile_picture']
        
        if 'genres' in data and isinstance(data['genres'], list):
            from models import UserPreference
            if not user.preferences:
                user.preferences = UserPreference(preferred_genres=data['genres'])
            else:
                user.preferences.preferred_genres = data['genres']
            
        user.save()
        
        return jsonify({
            'message': 'Profile updated',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Update failed', 'error': str(e)}), 500

@auth_bp.route('/change-password', methods=['PUT'])
def change_password():
    try:
        data = request.get_json()
        if not data.get('current_password') or not data.get('new_password'):
            return jsonify({'message': 'Missing fields'}), 400
            
        from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
        verify_jwt_in_request()
        current_user_id = get_jwt_identity()
        
        user = User.objects(id=current_user_id).first()
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        if not bcrypt.check_password_hash(user.password_hash, data['current_password']):
             return jsonify({'message': 'Incorrect current password'}), 400
             
        user.password_hash = bcrypt.generate_password_hash(data['new_password']).decode('utf-8')
        user.save()
        
        return jsonify({'message': 'Password changed successfully'}), 200
    except Exception as e:
        return jsonify({'message': 'Password change failed', 'error': str(e)}), 500