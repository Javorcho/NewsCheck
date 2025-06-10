from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
from .db import init_db
from .routes.auth import auth_bp
from .routes.news import news_bp
from .routes.verification import verification_bp
from ..config import config

def create_app(config_name=None):
    """Create and configure the Flask application."""
    if config_name is None:
        config_name = os.environ.get('FLASK_CONFIG', 'default')
    
    app = Flask(__name__, instance_relative_config=True)
    
    # Load configuration
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)
    
    # Initialize extensions
    init_db(app)
    jwt = JWTManager(app)
    CORS(app, resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}})
    
    # Initialize rate limiter
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=["200 per day", "50 per hour"]
    )
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(news_bp, url_prefix='/api/news')
    app.register_blueprint(verification_bp, url_prefix='/api/verify')
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Not found'}, 404
    
    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f'Server Error: {error}')
        return {'error': 'Internal server error'}, 500
    
    @app.errorhandler(429)
    def ratelimit_handler(error):
        return {'error': 'Rate limit exceeded'}, 429
    
    return app 