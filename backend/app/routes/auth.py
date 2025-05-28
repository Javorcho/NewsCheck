from flask import Blueprint, request, jsonify
from app import db, bcrypt
from app.models import User, FailedLogin, BlockedUser
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from email_validator import validate_email, EmailNotValidError

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['username', 'email', 'password']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Validate email
    try:
        valid = validate_email(data['email'])
        email = valid.email
    except EmailNotValidError:
        return jsonify({'error': 'Invalid email address'}), 400
    
    # Check if username or email already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'Username already exists'}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already exists'}), 409
    
    # Create new user
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    new_user = User(
        username=data['username'],
        email=email,
        password_hash=hashed_password
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not all(k in data for k in ('username', 'password')):
        return jsonify({'error': 'Missing username or password'}), 400
    
    user = User.query.filter_by(username=data['username']).first()
    
    # Check if user is blocked
    blocked = BlockedUser.query.filter_by(user_id=user.id if user else None).first()
    if blocked and blocked.blocked_until > datetime.utcnow():
        return jsonify({
            'error': 'Account is blocked',
            'blocked_until': blocked.blocked_until.isoformat()
        }), 403
    
    if not user or not bcrypt.check_password_hash(user.password_hash, data['password']):
        # Record failed login attempt
        failed_login = FailedLogin(
            username=data['username'],
            ip_address=request.remote_addr
        )
        db.session.add(failed_login)
        
        # Check for multiple failed attempts
        recent_failures = FailedLogin.query.filter_by(
            username=data['username'],
            ip_address=request.remote_addr
        ).filter(
            FailedLogin.attempt_time > datetime.utcnow() - timedelta(minutes=10)
        ).count()
        
        if recent_failures >= 5 and user:
            # Block the user
            block = BlockedUser(
                user_id=user.id,
                blocked_until=datetime.utcnow() + timedelta(minutes=10),
                reason='Multiple failed login attempts'
            )
            user.is_blocked = True
            db.session.add(block)
        
        db.session.commit()
        return jsonify({'error': 'Invalid username or password'}), 401
    
    if user.is_blocked:
        return jsonify({'error': 'Account is blocked'}), 403
    
    # Create access token
    access_token = create_access_token(identity=user.id)
    return jsonify({
        'access_token': access_token,
        'user_id': user.id,
        'is_admin': user.is_admin
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_admin': user.is_admin,
        'created_at': user.created_at.isoformat()
    }), 200

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    data = request.get_json()
    
    if 'email' in data:
        try:
            valid = validate_email(data['email'])
            email = valid.email
            if User.query.filter(User.email == email, User.id != current_user_id).first():
                return jsonify({'error': 'Email already exists'}), 409
            user.email = email
        except EmailNotValidError:
            return jsonify({'error': 'Invalid email address'}), 400
    
    if 'password' in data:
        user.password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    db.session.commit()
    return jsonify({'message': 'Profile updated successfully'}), 200 