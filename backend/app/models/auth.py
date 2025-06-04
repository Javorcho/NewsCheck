from datetime import datetime
from ..db import db

class FailedLogin(db.Model):
    """Model for tracking failed login attempts."""
    __tablename__ = 'failed_logins'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    ip_address = db.Column(db.String(45), nullable=False)  # IPv6 addresses can be up to 45 chars
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<FailedLogin {self.id}>'

class BlockedUser(db.Model):
    """Model for tracking blocked users and IP addresses."""
    __tablename__ = 'blocked_users'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    reason = db.Column(db.String(255), nullable=False)
    blocked_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    blocked_until = db.Column(db.DateTime, nullable=False)
    
    def __repr__(self):
        return f'<BlockedUser {self.id}>' 