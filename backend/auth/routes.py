from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from models import db, User
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
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'User already exists'}), 400
        
        # Create user
        hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
        username = data.get('username') or data['email'].split('@')[0]
        
        user = User(
            email=data['email'],
            username=username,
            password_hash=hashed_password
        )
        
        db.session.add(user)
        db.session.commit()
        
        # Create token
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'User created',
            'user': user.to_dict(),
            'token': access_token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'message': 'Email and password required'}), 400
        
        # Find user
        user = User.query.filter_by(email=data['email']).first()
        
        if not user or not bcrypt.check_password_hash(user.password_hash, data['password']):
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Create token
        access_token = create_access_token(identity=user.id)
        
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
        user = User.query.filter_by(email=demo_email).first()
        
        if not user:
            hashed_password = bcrypt.generate_password_hash('demo123').decode('utf-8')
            user = User(
                email=demo_email,
                username='DemoUser',
                password_hash=hashed_password
            )
            db.session.add(user)
            db.session.commit()
        
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'message': 'Demo login successful',
            'user': user.to_dict(),
            'token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Demo login failed', 'error': str(e)}), 500