from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, VerificationResult
from app.services.news_verifier import NewsVerifier
from datetime import datetime

verification_bp = Blueprint('verification', __name__)

@verification_bp.route('/verify', methods=['POST'])
@jwt_required()
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