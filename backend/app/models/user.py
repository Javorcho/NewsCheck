from datetime import datetime
from flask_bcrypt import Bcrypt
from ..db import db

bcrypt = Bcrypt()

class User(db.Model):
    """User model for authentication and user management."""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Authentication related fields
    failed_login_attempts = db.Column(db.Integer, default=0)
    last_failed_login = db.Column(db.DateTime, nullable=True)
    is_blocked = db.Column(db.Boolean, default=False)
    blocked_until = db.Column(db.DateTime, nullable=True)
    
    def __init__(self, username, email, password, is_admin=False):
        self.username = username
        self.email = email
        self.set_password(password)
        self.is_admin = is_admin
    
    def set_password(self, password):
        """Hash and set the user's password."""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')
    
    def check_password(self, password):
        """Check if the provided password matches the hash."""
        return bcrypt.check_password_hash(self.password_hash, password)
    
    def increment_failed_login(self):
        """Increment failed login attempts and update timestamp."""
        self.failed_login_attempts += 1
        self.last_failed_login = datetime.utcnow()
        db.session.commit()
    
    def reset_failed_login(self):
        """Reset failed login attempts after successful login."""
        self.failed_login_attempts = 0
        self.last_failed_login = None
        self.last_login = datetime.utcnow()
        db.session.commit()
    
    def block_user(self, duration_minutes, reason=None):
        """Block the user for a specified duration."""
        self.is_blocked = True
        self.blocked_until = datetime.utcnow() + timedelta(minutes=duration_minutes)
        db.session.commit()
    
    def unblock_user(self):
        """Unblock the user."""
        self.is_blocked = False
        self.blocked_until = None
        self.failed_login_attempts = 0
        db.session.commit()
    
    def is_blocked_now(self):
        """Check if the user is currently blocked."""
        if not self.is_blocked:
            return False
        if self.blocked_until and datetime.utcnow() > self.blocked_until:
            self.unblock_user()
            return False
        return True
    
    def to_dict(self):
        """Convert user object to dictionary."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'is_admin': self.is_admin,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None
        }
    
    def __repr__(self):
        return f'<User {self.username}>' 