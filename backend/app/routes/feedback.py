from flask import Blueprint, jsonify, request
from app import db
from app.models import Feedback, NewsRequest, User
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/news/<int:news_id>/feedback', methods=['POST'])
@jwt_required()
def submit_feedback(news_id):
    current_user_id = get_jwt_identity()
    news_request = NewsRequest.query.get_or_404(news_id)
    data = request.get_json()
    
    # Validate required fields
    if 'agrees_with_analysis' not in data:
        return jsonify({'error': 'Missing agreement status'}), 400
        
    # Check if user has already provided feedback
    existing_feedback = Feedback.query.filter_by(
        user_id=current_user_id,
        news_request_id=news_id
    ).first()
    
    if existing_feedback:
        return jsonify({'error': 'You have already provided feedback for this analysis'}), 400
        
    # Create feedback
    feedback = Feedback(
        user_id=current_user_id,
        news_request_id=news_id,
        agrees_with_analysis=bool(data['agrees_with_analysis']),
        comment=data.get('comment', '').strip()
    )
    
    db.session.add(feedback)
    db.session.commit()
    
    return jsonify({
        'message': 'Feedback submitted successfully',
        'feedback': {
            'id': feedback.id,
            'agrees_with_analysis': feedback.agrees_with_analysis,
            'comment': feedback.comment,
            'created_at': feedback.created_at.isoformat()
        }
    }), 201

@feedback_bp.route('/news/<int:news_id>/feedback', methods=['GET'])
@jwt_required()
def get_feedback(news_id):
    news_request = NewsRequest.query.get_or_404(news_id)
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    
    # Only allow feedback viewing by the news request owner or admins
    if news_request.user_id != current_user_id and not user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
        
    feedback = Feedback.query.filter_by(news_request_id=news_id).all()
    
    return jsonify({
        'feedback': [{
            'id': f.id,
            'user': {
                'id': f.user.id,
                'username': f.user.username
            },
            'agrees_with_analysis': f.agrees_with_analysis,
            'comment': f.comment,
            'created_at': f.created_at.isoformat()
        } for f in feedback]
    }), 200

@feedback_bp.route('/feedback/<int:feedback_id>', methods=['PUT'])
@jwt_required()
def update_feedback(feedback_id):
    current_user_id = get_jwt_identity()
    feedback = Feedback.query.get_or_404(feedback_id)
    
    # Only allow feedback update by the owner
    if feedback.user_id != current_user_id:
        return jsonify({'error': 'Access denied'}), 403
        
    data = request.get_json()
    
    if 'agrees_with_analysis' in data:
        feedback.agrees_with_analysis = bool(data['agrees_with_analysis'])
        
    if 'comment' in data:
        feedback.comment = data['comment'].strip()
        
    db.session.commit()
    
    return jsonify({
        'message': 'Feedback updated successfully',
        'feedback': {
            'id': feedback.id,
            'agrees_with_analysis': feedback.agrees_with_analysis,
            'comment': feedback.comment,
            'created_at': feedback.created_at.isoformat()
        }
    }), 200

@feedback_bp.route('/feedback/<int:feedback_id>', methods=['DELETE'])
@jwt_required()
def delete_feedback(feedback_id):
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    feedback = Feedback.query.get_or_404(feedback_id)
    
    # Only allow feedback deletion by the owner or admins
    if feedback.user_id != current_user_id and not user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
        
    db.session.delete(feedback)
    db.session.commit()
    
    return jsonify({'message': 'Feedback deleted successfully'}), 200

@feedback_bp.route('/my/feedback', methods=['GET'])
@jwt_required()
def get_user_feedback():
    current_user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    feedback = Feedback.query.filter_by(user_id=current_user_id)\
        .order_by(Feedback.created_at.desc())\
        .paginate(page=page, per_page=per_page)
        
    return jsonify({
        'feedback': [{
            'id': f.id,
            'news_request': {
                'id': f.news_request.id,
                'content': f.news_request.content,
                'analysis_result': f.news_request.analysis_result
            },
            'agrees_with_analysis': f.agrees_with_analysis,
            'comment': f.comment,
            'created_at': f.created_at.isoformat()
        } for f in feedback.items],
        'total': feedback.total,
        'pages': feedback.pages,
        'current_page': feedback.page
    }), 200 