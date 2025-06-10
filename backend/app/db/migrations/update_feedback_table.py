"""Update feedback table

Revision ID: update_feedback_table
Revises: add_verification_results
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'update_feedback_table'
down_revision = 'add_verification_results'
branch_labels = None
depends_on = None

def upgrade():
    # Drop existing foreign key constraint
    op.drop_constraint('feedback_news_request_id_fkey', 'feedback', type_='foreignkey')
    
    # Drop the news_request_id column
    op.drop_column('feedback', 'news_request_id')
    
    # Add verification_id column
    op.add_column('feedback', sa.Column('verification_id', sa.Integer(), nullable=True))
    
    # Add foreign key constraint
    op.create_foreign_key(
        'feedback_verification_id_fkey',
        'feedback',
        'verification_results',
        ['verification_id'],
        ['id']
    )
    
    # Make verification_id non-nullable after adding the constraint
    op.alter_column('feedback', 'verification_id',
        existing_type=sa.Integer(),
        nullable=False
    )

def downgrade():
    # Drop verification_id foreign key constraint
    op.drop_constraint('feedback_verification_id_fkey', 'feedback', type_='foreignkey')
    
    # Drop verification_id column
    op.drop_column('feedback', 'verification_id')
    
    # Add back news_request_id column
    op.add_column('feedback', sa.Column('news_request_id', sa.Integer(), nullable=True))
    
    # Add back the original foreign key constraint
    op.create_foreign_key(
        'feedback_news_request_id_fkey',
        'feedback',
        'news_requests',
        ['news_request_id'],
        ['id']
    )
    
    # Make news_request_id non-nullable
    op.alter_column('feedback', 'news_request_id',
        existing_type=sa.Integer(),
        nullable=False
    ) 