"""Replace email/SMS OTP with authenticator-app MFA

Revision ID: b7d41e2a9c53
Revises: 37b555524bee
Create Date: 2026-10-12 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7d41e2a9c53'
down_revision: Union[str, Sequence[str], None] = '37b555524bee'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('totp_secret_encrypted', sa.String(), nullable=True))
    # Existing accounts start with MFA off and are asked to set it up at their next login.
    op.add_column('users', sa.Column('mfa_enabled', sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column('users', sa.Column('totp_last_used_step', sa.Integer(), nullable=True))
    op.drop_column('users', 'otp_expires_at')
    op.drop_column('users', 'hashed_otp')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('users', sa.Column('hashed_otp', sa.String(), nullable=True))
    op.add_column('users', sa.Column('otp_expires_at', sa.DateTime(), nullable=True))
    op.drop_column('users', 'totp_last_used_step')
    op.drop_column('users', 'mfa_enabled')
    op.drop_column('users', 'totp_secret_encrypted')
