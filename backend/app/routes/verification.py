from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, VerificationResult, Feedback
from app.services.news_verifier import NewsVerifier
from datetime import datetime
from sqlalchemy import desc
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

verification_bp = Blueprint('verification', __name__)

# Rate limits
VERIFICATION_LIMIT = "10 per minute"
FEEDBACK_LIMIT = "20 per minute"

@verification_bp.route('/verify', methods=['POST'])
@jwt_required()
@limiter.limit(VERIFICATION_LIMIT)
def verify_news():
    data = request.get_json()
    url = data.get('url')
    
    if not url:
        return jsonify({'error': 'URL is required'}), 400
    
    try:
        # Get current user
        user_id = get_jwt_identity()
        
        # Initialize news verifier
        verifier = NewsVerifier()
        
        # Verify the news article
        result = verifier.verify(url)
        
        # Save verification result to database
        verification_result = VerificationResult(
            user_id=user_id,
            url=url,
            is_fake=result['is_fake'],
            confidence=result['confidence'],
            reasons=result['reasons'],
            timestamp=datetime.utcnow()
        )
        
        db.session.add(verification_result)
        db.session.commit()
        
        return jsonify({
            'url': url,
            'isFake': result['is_fake'],
            'confidence': result['confidence'],
            'reasons': result['reasons'],
            'timestamp': verification_result.timestamp.isoformat()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@verification_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    try:
        # Get current user
        user_id = get_jwt_identity()
        
        # Get verification history for the user
        history = VerificationResult.query.filter_by(user_id=user_id)\
            .order_by(desc(VerificationResult.timestamp))\
            .all()
        
        # Format the response
        history_data = [{
            'id': result.id,
            'url': result.url,
            'isFake': result.is_fake,
            'confidence': result.confidence,
            'reasons': result.reasons,
            'timestamp': result.timestamp.isoformat()
        } for result in history]
        
        return jsonify(history_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@verification_bp.route('/feedback', methods=['POST'])
@jwt_required()
@limiter.limit(FEEDBACK_LIMIT)
def submit_feedback():
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Validate required fields
        if not all(k in data for k in ['verification_id', 'agrees_with_analysis']):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check if verification exists
        verification = VerificationResult.query.get(data['verification_id'])
        if not verification:
            return jsonify({'error': 'Verification not found'}), 404
        
        # Create feedback
        feedback = Feedback(
            user_id=user_id,
            verification_id=data['verification_id'],
            agrees_with_analysis=data['agrees_with_analysis'],
            comment=data.get('comment')
        )
        
        db.session.add(feedback)
        db.session.commit()
        
        return jsonify({
            'message': 'Feedback submitted successfully',
            'feedback_id': feedback.id
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500 