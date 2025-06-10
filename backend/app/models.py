from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import json

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    news_requests = db.relationship('NewsRequest', backref='user', lazy=True)
    feedback = db.relationship('Feedback', backref='user', lazy=True)
    failed_logins = db.relationship('FailedLogin', backref='user', lazy=True)
    verifications = db.relationship('VerificationResult', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class NewsRequest(db.Model):
    __tablename__ = 'news_requests'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    is_url = db.Column(db.Boolean, nullable=False)
    analysis_result = db.Column(db.String(20), nullable=False)
    confidence_score = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    feedback = db.relationship('Feedback', backref='news_request', lazy=True)

class Feedback(db.Model):
    __tablename__ = 'feedback'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    verification_id = db.Column(db.Integer, db.ForeignKey('verification_results.id'), nullable=False)
    agrees_with_analysis = db.Column(db.Boolean, nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref='feedback')
    verification = db.relationship('VerificationResult', backref='feedback')

class FailedLogin(db.Model):
    __tablename__ = 'failed_logins'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    ip_address = db.Column(db.String(45), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class BlockedUser(db.Model):
    __tablename__ = 'blocked_users'
    
    id = db.Column(db.Integer, primary_key=True)
    ip_address = db.Column(db.String(45), nullable=False)
    reason = db.Column(db.String(200))
    blocked_until = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class VerificationResult(db.Model):
    __tablename__ = 'verification_results'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    is_fake = db.Column(db.Boolean, nullable=False)
    confidence = db.Column(db.Float, nullable=False)
    reasons = db.Column(db.JSON, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __init__(self, **kwargs):
        super(VerificationResult, self).__init__(**kwargs)
        if isinstance(self.reasons, list):
            self.reasons = json.dumps(self.reasons)
    
    @property
    def reasons_list(self):
        if isinstance(self.reasons, str):
            return json.loads(self.reasons)
        return self.reasons 