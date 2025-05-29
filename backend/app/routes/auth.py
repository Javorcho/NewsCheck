from flask import Blueprint, request, jsonify
from app import db
from app.models import User, FailedLogin, BlockedUser
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
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
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['username', 'email', 'password']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
        
    # Validate username
    username = data['username'].strip()
    if not re.match(r'^[a-zA-Z0-9_]{3,20}$', username):
        return jsonify({'error': 'Invalid username format'}), 400
        
    # Validate email
    try:
        email = validate_email(data['email'].strip()).email
    except EmailNotValidError:
        return jsonify({'error': 'Invalid email format'}), 400
        
    # Validate password
    password = data['password']
    if len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        
    # Check if username or email already exists
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already taken'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 400
        
    # Create new user
    user = User(username=username, email=email)
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    # Create access token
    access_token = create_access_token(identity=user.id)
    
    return jsonify({
        'message': 'Registration successful',
        'access_token': access_token,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_admin': user.is_admin
        }
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not all(k in data for k in ('username', 'password')):
        return jsonify({'error': 'Missing username or password'}), 400
        
    # Check if IP is blocked
    ip_address = request.remote_addr
    if is_ip_blocked(ip_address):
        return jsonify({'error': 'Too many failed attempts. Please try again later'}), 429
        
    user = User.query.filter_by(username=data['username']).first()
    
    if user and user.check_password(data['password']):
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403
            
        # Update last login time
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'access_token': access_token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'is_admin': user.is_admin
            }
        }), 200
    else:
        if user:
            record_failed_login(user.id, ip_address)
        return jsonify({'error': 'Invalid username or password'}), 401

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_admin': user.is_admin,
        'created_at': user.created_at.isoformat(),
        'last_login': user.last_login.isoformat() if user.last_login else None
    }), 200

@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    data = request.get_json()
    
    if 'email' in data:
        try:
            new_email = validate_email(data['email'].strip()).email
            if User.query.filter(User.email == new_email, User.id != current_user_id).first():
                return jsonify({'error': 'Email already registered'}), 400
            user.email = new_email
        except EmailNotValidError:
            return jsonify({'error': 'Invalid email format'}), 400
            
    if 'password' in data:
        if len(data['password']) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
        user.set_password(data['password'])
        
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_admin': user.is_admin
        }
    }), 200 