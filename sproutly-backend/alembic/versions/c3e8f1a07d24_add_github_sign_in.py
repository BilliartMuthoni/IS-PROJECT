"""Add GitHub sign-in: users.github_id and the oauth_flows table

Revision ID: c3e8f1a07d24
Revises: b7d41e2a9c53
Create Date: 2026-10-13 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c3e8f1a07d24'
down_revision: Union[str, Sequence[str], None] = 'b7d41e2a9c53'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('github_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_users_github_id'), 'users', ['github_id'], unique=True)

    op.create_table('oauth_flows',
    sa.Column('state', sa.String(), nullable=False),
    sa.Column('provider', sa.String(), nullable=False),
    sa.Column('app_redirect_uri', sa.String(), nullable=False),
    sa.Column('app_code_challenge', sa.String(), nullable=False),
    sa.Column('provider_code_verifier', sa.String(), nullable=False),
    sa.Column('expires_at', sa.DateTime(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.Column('login_code_hash', sa.String(), nullable=True),
    sa.Column('login_code_expires_at', sa.DateTime(), nullable=True),
    sa.Column('used', sa.Boolean(), server_default=sa.false(), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('state')
    )
    op.create_index(op.f('ix_oauth_flows_login_code_hash'), 'oauth_flows', ['login_code_hash'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_oauth_flows_login_code_hash'), table_name='oauth_flows')
    op.drop_table('oauth_flows')
    op.drop_index(op.f('ix_users_github_id'), table_name='users')
    op.drop_column('users', 'github_id')
