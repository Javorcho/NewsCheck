from datetime import datetime
from ..db import db

class NewsVerification(db.Model):
    """Model for storing news verification results."""
    __tablename__ = 'news_verifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    url = db.Column(db.String(512), nullable=True)
    reliability_score = db.Column(db.Float, nullable=False)
    verification_status = db.Column(db.String(20), nullable=False)
    analysis_result = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('verifications', lazy=True))
    feedback = db.relationship('VerificationFeedback', backref='verification', lazy=True)
    
    def __repr__(self):
        return f'<NewsVerification {self.id}>'

class VerificationFeedback(db.Model):
    """Model for storing user feedback on verification results."""
    __tablename__ = 'verification_feedback'
    
    id = db.Column(db.Integer, primary_key=True)
    verification_id = db.Column(db.Integer, db.ForeignKey('news_verifications.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    agrees_with_analysis = db.Column(db.Boolean, nullable=False)
    comment = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('verification_feedback', lazy=True))
    
    def __repr__(self):
        return f'<VerificationFeedback {self.id}>' 