from flask import Blueprint, request, jsonify
from app import db
from app.models import NewsRequest, User
from flask_jwt_extended import jwt_required, get_jwt_identity
import validators
import requests
from datetime import datetime

news_bp = Blueprint('news', __name__)

def analyze_news(content, is_url):
    """
    Placeholder function for news analysis.
    In a real implementation, this would use ML models or external APIs.
    """
    # TODO: Implement actual news analysis logic
    # This is just a dummy implementation
    return {
        'result': 'reliable' if len(content) > 100 else 'unreliable',
        'confidence': 0.85
    }

@news_bp.route('/analyze', methods=['POST'])
@jwt_required()
def submit_news():
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
            # In a real implementation, you would extract the text content from the HTML
            # For now, we'll just use the URL itself
        except requests.exceptions.RequestException:
            return jsonify({'error': 'Could not fetch URL content'}), 400
    
    # Perform analysis
    analysis = analyze_news(content, is_url)
    
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
    
    return jsonify({
        'id': news_request.id,
        'result': analysis['result'],
        'confidence': analysis['confidence'],
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