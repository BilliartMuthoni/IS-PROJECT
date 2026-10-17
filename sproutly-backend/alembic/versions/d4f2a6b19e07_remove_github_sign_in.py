"""Remove GitHub sign-in: drop users.github_id

GitHub sign-in served no one (farmers rarely have GitHub accounts; admins use a
password with a mandatory authenticator code), so its code and column are removed
to keep the attack surface small. The oauth_flows table stays: Google uses it.

Revision ID: d4f2a6b19e07
Revises: c3e8f1a07d24
Create Date: 2026-10-17 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd4f2a6b19e07'
down_revision: Union[str, Sequence[str], None] = 'c3e8f1a07d24'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Unfinished GitHub sign-in attempts can no longer complete.
    op.execute("DELETE FROM oauth_flows WHERE provider = 'github'")
    op.drop_index(op.f('ix_users_github_id'), table_name='users')
    op.drop_column('users', 'github_id')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('users', sa.Column('github_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_users_github_id'), 'users', ['github_id'], unique=True)
