from flask import Flask, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_caching import Cache
from config import Config
from extensions import cache

from auth.routes import auth_bp
from recommendation.routes import recommendation_bp
from watchlist.routes import watchlist_bp
from mongoengine import connect
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}}, supports_credentials=True)
    bcrypt = Bcrypt(app)
    jwt = JWTManager(app)
    
    # Initialize Cache with app
    cache.init_app(app)
    
    # Connect to MongoDB
    connect(
        db=app.config['MONGODB_SETTINGS']['db'],
        host=app.config['MONGODB_SETTINGS']['host'],
        port=app.config['MONGODB_SETTINGS']['port']
    )
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(recommendation_bp, url_prefix='/api/recommend')
    app.register_blueprint(watchlist_bp, url_prefix='/api/watchlist')
    
    from admin.routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    
    @app.route('/')
    def index():
        return jsonify({'message': 'Movie Recommendation API'})
    
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'healthy'}), 200
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000, host='0.0.0.0')