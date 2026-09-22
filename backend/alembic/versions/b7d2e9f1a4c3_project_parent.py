"""subprojects: nullable parent_id on projects

Revision ID: b7d2e9f1a4c3
Revises: a3f1c2d4e5b6
Create Date: 2026-09-22 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7d2e9f1a4c3'
down_revision: Union[str, Sequence[str], None] = 'a3f1c2d4e5b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema. Existing projects stay top-level (parent_id NULL)."""
    op.add_column('projects', sa.Column('parent_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        'projects_parent_id_fkey', 'projects', 'projects', ['parent_id'], ['id'], ondelete='SET NULL'
    )
    op.create_index(op.f('ix_projects_parent_id'), 'projects', ['parent_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema. Flattens every project back to top level."""
    op.drop_index(op.f('ix_projects_parent_id'), table_name='projects')
    op.drop_constraint('projects_parent_id_fkey', 'projects', type_='foreignkey')
    op.drop_column('projects', 'parent_id')
