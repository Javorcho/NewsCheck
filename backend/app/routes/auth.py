from flask import Blueprint, request, jsonify
from app import db
from app.models import User, FailedLogin, BlockedUser
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt
)
from datetime import datetime, timedelta
import re
from email_validator import validate_email, EmailNotValidError

auth_bp = Blueprint('auth', __name__)

def is_ip_blocked(ip_address):
    """Check if an IP address is blocked"""
    blocked = BlockedUser.query.filter_by(ip_address=ip_address)\
        .filter(BlockedUser.blocked_until > datetime.utcnow())\
        .first()
    return blocked is not None

def record_failed_login(user_id, ip_address):
    """Record a failed login attempt"""
    failed_login = FailedLogin(user_id=user_id, ip_address=ip_address)
    db.session.add(failed_login)
    db.session.commit()
    
    # Check if we should block the IP
    recent_failures = FailedLogin.query\
        .filter_by(ip_address=ip_address)\
        .filter(FailedLogin.timestamp > datetime.utcnow() - timedelta(minutes=15))\
        .count()
        
    if recent_failures >= 5:
        blocked = BlockedUser(
            ip_address=ip_address,
            reason="Too many failed login attempts",
            blocked_until=datetime.utcnow() + timedelta(minutes=30)
        )
        db.session.add(blocked)
        db.session.commit()

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ('username', 'email', 'password')):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Validate email format
    try:
        validate_email(data['email'])
    except EmailNotValidError:
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Check if username or email already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already exists'}), 409
    
    # Create new user
    try:
        user = User(
            username=data['username'],
            email=data['email'],
            password=data['password']
        )
        db.session.add(user)
        db.session.commit()
        
        # Create tokens
        access_token = create_access_token(identity=user.id)
        refresh_token = create_refresh_token(identity=user.id)
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user and return JWT tokens."""
    data = request.get_json()
    
    if not all(k in data for k in ('username', 'password')):
        return jsonify({'error': 'Missing username or password'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']):
        if user:
            user.increment_failed_login()
            # Block user after 5 failed attempts
            if user.failed_login_attempts >= 5:
                user.block_user(duration_minutes=30, reason='Too many failed login attempts')
        return jsonify({'error': 'Invalid username or password'}), 401
    
    if user.is_blocked_now():
        return jsonify({
            'error': 'Account is blocked',
            'blocked_until': user.blocked_until.isoformat() if user.blocked_until else None
        }), 403
    
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403
    
    # Reset failed login attempts and update last login
    user.reset_failed_login()
    
    # Create tokens
    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)
    
    return jsonify({
        'access_token': access_token,
        'refresh_token': refresh_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token."""
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=current_user_id)
    return jsonify({'access_token': access_token}), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile."""
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    return jsonify(user.to_dict()), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile."""
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    data = request.get_json()
    
    try:
        if 'email' in data:
            # Validate email format
            try:
                validate_email(data['email'])
            except EmailNotValidError:
                return jsonify({'error': 'Invalid email format'}), 400
            
            # Check if email is already taken
            if User.query.filter(User.email == data['email'], User.id != current_user_id).first():
                return jsonify({'error': 'Email already exists'}), 409
            user.email = data['email']
        
        if 'password' in data:
            user.set_password(data['password'])
        
        db.session.commit()
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user (client-side token invalidation)."""
    # Note: JWT tokens are stateless, so we can't invalidate them server-side
    # The client should remove the tokens
    return jsonify({'message': 'Successfully logged out'}), 200 