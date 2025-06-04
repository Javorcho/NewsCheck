from flask import Blueprint, request, jsonify
from app import db
from app.models import NewsRequest, User
from app.services.news_analyzer import NewsAnalyzer
from flask_jwt_extended import jwt_required, get_jwt_identity
import validators
import requests
from datetime import datetime
from ..services.news_verification import NewsVerificationService
from ..models.news import NewsVerification

news_bp = Blueprint('news', __name__)
news_analyzer = NewsAnalyzer()
verification_service = NewsVerificationService()

@news_bp.route('/analyze', methods=['POST'])
@jwt_required()
async def submit_news():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if 'content' not in data:
        return jsonify({'error': 'No content provided'}), 400
    
    content = data['content'].strip()
    is_url = validators.url(content) is True
    
    if is_url:
        try:
            response = requests.get(content, timeout=5)
            if response.status_code != 200:
                return jsonify({'error': 'Could not fetch URL content'}), 400
        except requests.exceptions.RequestException:
            return jsonify({'error': 'Could not fetch URL content'}), 400
    
    # Perform analysis using our new analyzer
    analysis = await news_analyzer.analyze_news(content, is_url)
    
    if analysis.get('result') == 'error':
        return jsonify({'error': 'Analysis failed', 'details': analysis.get('error')}), 500
    
    # Create news request record
    news_request = NewsRequest(
        user_id=current_user_id,
        content=content,
        is_url=is_url,
        analysis_result=analysis['result'],
        confidence_score=analysis['confidence']
    )
    
    db.session.add(news_request)
    db.session.commit()
    
    # Return detailed analysis results
    return jsonify({
        'id': news_request.id,
        'result': analysis['result'],
        'confidence': analysis['confidence'],
        'details': analysis['details'],
        'created_at': news_request.created_at.isoformat()
    }), 201

@news_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Get user's news request history with pagination
    news_requests = NewsRequest.query.filter_by(user_id=current_user_id)\
        .order_by(NewsRequest.created_at.desc())\
        .paginate(page=page, per_page=per_page)
    
    return jsonify({
        'items': [{
            'id': nr.id,
            'content': nr.content,
            'is_url': nr.is_url,
            'result': nr.analysis_result,
            'confidence': nr.confidence_score,
            'created_at': nr.created_at.isoformat()
        } for nr in news_requests.items],
        'total': news_requests.total,
        'pages': news_requests.pages,
        'current_page': news_requests.page
    }), 200

@news_bp.route('/<int:news_id>', methods=['GET'])
@jwt_required()
def get_news_details(news_id):
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    
    news_request = NewsRequest.query.get_or_404(news_id)
    
    # Check if user has access to this news request
    if news_request.user_id != current_user_id and not user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
    
    return jsonify({
        'id': news_request.id,
        'content': news_request.content,
        'is_url': news_request.is_url,
        'result': news_request.analysis_result,
        'confidence': news_request.confidence_score,
        'created_at': news_request.created_at.isoformat(),
        'feedback': [{
            'id': f.id,
            'agrees_with_analysis': f.agrees_with_analysis,
            'comment': f.comment,
            'created_at': f.created_at.isoformat()
        } for f in news_request.feedback]
    }), 200

@news_bp.route('/verify', methods=['POST'])
@jwt_required()
def analyze_news():
    """
    Analyze a news article for verification.
    
    Request body:
    {
        "content": "string",  # The text content to analyze
        "url": "string"       # Optional URL of the article
    }
    """
    data = request.get_json()
    
    if not data or 'content' not in data:
        return jsonify({"error": "Content is required"}), 400
    
    try:
        # Get verification results
        verification_result = verification_service.verify_news(
            content=data['content'],
            url=data.get('url')
        )
        
        # Save verification result to database
        user_id = get_jwt_identity()
        news_verification = NewsVerification(
            user_id=user_id,
            content=data['content'],
            url=data.get('url'),
            reliability_score=verification_result['reliability_score'],
            verification_status=verification_result['verification_status'],
            analysis_result=verification_result,
            created_at=datetime.utcnow()
        )
        
        db.session.add(news_verification)
        db.session.commit()
        
        return jsonify({
            "message": "News analysis completed",
            "verification_id": news_verification.id,
            "result": verification_result
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@news_bp.route('/verify/history', methods=['GET'])
@jwt_required()
def get_verification_history():
    """Get the user's news verification history."""
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    verifications = NewsVerification.query.filter_by(user_id=user_id)\
        .order_by(NewsVerification.created_at.desc())\
        .paginate(page=page, per_page=per_page)
    
    return jsonify({
        "verifications": [{
            "id": v.id,
            "content": v.content,
            "url": v.url,
            "reliability_score": v.reliability_score,
            "verification_status": v.verification_status,
            "created_at": v.created_at.isoformat()
        } for v in verifications.items],
        "total": verifications.total,
        "pages": verifications.pages,
        "current_page": verifications.page
    }), 200

@news_bp.route('/verify/<int:verification_id>', methods=['GET'])
@jwt_required()
def get_verification_details(verification_id):
    """Get detailed information about a specific verification."""
    user_id = get_jwt_identity()
    
    verification = NewsVerification.query.filter_by(
        id=verification_id,
        user_id=user_id
    ).first()
    
    if not verification:
        return jsonify({"error": "Verification not found"}), 404
    
    return jsonify({
        "id": verification.id,
        "content": verification.content,
        "url": verification.url,
        "reliability_score": verification.reliability_score,
        "verification_status": verification.verification_status,
        "analysis_result": verification.analysis_result,
        "created_at": verification.created_at.isoformat()
    }), 200 