from flask import Blueprint, request, jsonify
from app import db
from app.models import Feedback, NewsRequest, User
from flask_jwt_extended import jwt_required, get_jwt_identity

feedback_bp = Blueprint('feedback', __name__)

@feedback_bp.route('/submit/<int:news_id>', methods=['POST'])
@jwt_required()
def submit_feedback(news_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if 'agrees_with_analysis' not in data:
        return jsonify({'error': 'Missing agreement status'}), 400
    
    news_request = NewsRequest.query.get_or_404(news_id)
    
    # Check if user has already submitted feedback for this news request
    existing_feedback = Feedback.query.filter_by(
        user_id=current_user_id,
        news_request_id=news_id
    ).first()
    
    if existing_feedback:
        return jsonify({'error': 'Feedback already submitted'}), 409
    
    feedback = Feedback(
        user_id=current_user_id,
        news_request_id=news_id,
        agrees_with_analysis=data['agrees_with_analysis'],
        comment=data.get('comment')
    )
    
    db.session.add(feedback)
    db.session.commit()
    
    return jsonify({
        'id': feedback.id,
        'agrees_with_analysis': feedback.agrees_with_analysis,
        'comment': feedback.comment,
        'created_at': feedback.created_at.isoformat()
    }), 201

@feedback_bp.route('/<int:feedback_id>', methods=['PUT'])
@jwt_required()
def update_feedback(feedback_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    feedback = Feedback.query.get_or_404(feedback_id)
    
    # Check if user owns this feedback
    if feedback.user_id != current_user_id:
        return jsonify({'error': 'Access denied'}), 403
    
    if 'agrees_with_analysis' in data:
        feedback.agrees_with_analysis = data['agrees_with_analysis']
    
    if 'comment' in data:
        feedback.comment = data['comment']
    
    db.session.commit()
    
    return jsonify({
        'id': feedback.id,
        'agrees_with_analysis': feedback.agrees_with_analysis,
        'comment': feedback.comment,
        'created_at': feedback.created_at.isoformat()
    }), 200

@feedback_bp.route('/<int:feedback_id>', methods=['DELETE'])
@jwt_required()
def delete_feedback(feedback_id):
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    feedback = Feedback.query.get_or_404(feedback_id)
    
    # Check if user owns this feedback or is admin
    if feedback.user_id != current_user_id and not user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
    
    db.session.delete(feedback)
    db.session.commit()
    
    return '', 204

@feedback_bp.route('/news/<int:news_id>', methods=['GET'])
@jwt_required()
def get_news_feedback(news_id):
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    news_request = NewsRequest.query.get_or_404(news_id)
    
    # Check if user has access to this news request's feedback
    if news_request.user_id != current_user_id and not user.is_admin:
        return jsonify({'error': 'Access denied'}), 403
    
    feedback = Feedback.query.filter_by(news_request_id=news_id).all()
    
    return jsonify({
        'news_id': news_id,
        'feedback': [{
            'id': f.id,
            'user_id': f.user_id,
            'agrees_with_analysis': f.agrees_with_analysis,
            'comment': f.comment,
            'created_at': f.created_at.isoformat()
        } for f in feedback]
    }), 200 