from flask import Blueprint, request, jsonify
from app import db
from app.models import User, NewsRequest, BlockedUser, Feedback
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from functools import wraps

admin_bp = Blueprint('admin', __name__)

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = User.query.get_or_404(current_user_id)
        if not user.is_admin:
            return jsonify({'error': 'Admin privileges required'}), 403
        return f(*args, **kwargs)
    return decorated_function

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
@admin_required
def list_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    users = User.query.paginate(page=page, per_page=per_page)
    
    return jsonify({
        'items': [{
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_admin': user.is_admin,
            'is_blocked': user.is_blocked,
            'created_at': user.created_at.isoformat()
        } for user in users.items],
        'total': users.total,
        'pages': users.pages,
        'current_page': users.page
    }), 200

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
@admin_required
def get_user_details(user_id):
    user = User.query.get_or_404(user_id)
    
    return jsonify({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'is_admin': user.is_admin,
        'is_blocked': user.is_blocked,
        'created_at': user.created_at.isoformat(),
        'news_requests_count': NewsRequest.query.filter_by(user_id=user.id).count(),
        'feedback_count': Feedback.query.filter_by(user_id=user.id).count()
    }), 200

@admin_bp.route('/users/<int:user_id>/block', methods=['POST'])
@jwt_required()
@admin_required
def block_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if user.is_admin:
        return jsonify({'error': 'Cannot block admin users'}), 403
    
    duration_minutes = data.get('duration_minutes', 10)
    reason = data.get('reason', 'Administrative action')
    
    user.is_blocked = True
    blocked = BlockedUser(
        user_id=user.id,
        blocked_until=datetime.utcnow() + timedelta(minutes=duration_minutes),
        reason=reason
    )
    
    db.session.add(blocked)
    db.session.commit()
    
    return jsonify({
        'message': 'User blocked successfully',
        'blocked_until': blocked.blocked_until.isoformat()
    }), 200

@admin_bp.route('/users/<int:user_id>/unblock', methods=['POST'])
@jwt_required()
@admin_required
def unblock_user(user_id):
    user = User.query.get_or_404(user_id)
    
    user.is_blocked = False
    BlockedUser.query.filter_by(user_id=user.id).delete()
    db.session.commit()
    
    return jsonify({'message': 'User unblocked successfully'}), 200

@admin_bp.route('/news', methods=['GET'])
@jwt_required()
@admin_required
def list_news_requests():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    news_requests = NewsRequest.query\
        .order_by(NewsRequest.created_at.desc())\
        .paginate(page=page, per_page=per_page)
    
    return jsonify({
        'items': [{
            'id': nr.id,
            'user_id': nr.user_id,
            'content': nr.content,
            'is_url': nr.is_url,
            'result': nr.analysis_result,
            'confidence': nr.confidence_score,
            'created_at': nr.created_at.isoformat(),
            'feedback_count': len(nr.feedback)
        } for nr in news_requests.items],
        'total': news_requests.total,
        'pages': news_requests.pages,
        'current_page': news_requests.page
    }), 200

@admin_bp.route('/news/<int:news_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_news_request(news_id):
    news_request = NewsRequest.query.get_or_404(news_id)
    
    # Delete associated feedback first
    Feedback.query.filter_by(news_request_id=news_id).delete()
    db.session.delete(news_request)
    db.session.commit()
    
    return '', 204

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
@admin_required
def get_stats():
    total_users = User.query.count()
    total_news_requests = NewsRequest.query.count()
    total_feedback = Feedback.query.count()
    
    reliable_news = NewsRequest.query.filter_by(analysis_result='reliable').count()
    unreliable_news = NewsRequest.query.filter_by(analysis_result='unreliable').count()
    
    return jsonify({
        'total_users': total_users,
        'total_news_requests': total_news_requests,
        'total_feedback': total_feedback,
        'reliable_news_count': reliable_news,
        'unreliable_news_count': unreliable_news,
        'feedback_ratio': total_feedback / total_news_requests if total_news_requests > 0 else 0
    }), 200 