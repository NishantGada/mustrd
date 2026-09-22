"""single board per user, projects, and ticket keys

Revision ID: a3f1c2d4e5b6
Revises: 6bbf441af56e
Create Date: 2026-09-22 18:30:00.000000

- Enforces exactly one board per user (aborts if any user has more than one, rather
  than guessing how to merge their columns).
- Adds projects (name, description, key prefix, color, per-project ticket counter).
- Gives every goal an optional project and a ticket number. Existing goals have no
  project, so they're numbered TBD-1, TBD-2… per user in creation order.
- Inserts a "Ready" column after the first column on boards that don't have one.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from uuid6 import uuid7


# revision identifiers, used by Alembic.
revision: str = 'a3f1c2d4e5b6'
down_revision: Union[str, Sequence[str], None] = '6bbf441af56e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()

    # --- Guard: this migration does not merge multiple boards. ---
    multi = conn.execute(sa.text(
        "SELECT user_id FROM boards GROUP BY user_id HAVING count(*) > 1"
    )).fetchall()
    if multi:
        raise RuntimeError(
            f"{len(multi)} user(s) have more than one board; merge them manually "
            "before running this migration."
        )

    # --- Boards: one per user, plus the TBD ticket counter. ---
    op.drop_index(op.f('ix_boards_user_id'), table_name='boards')
    op.create_unique_constraint('uq_boards_user_id', 'boards', ['user_id'])
    op.drop_column('boards', 'position')
    op.add_column('boards', sa.Column(
        'next_unassigned_number', sa.Integer(), server_default=sa.text('1'), nullable=False
    ))

    # --- Projects ---
    op.create_table('projects',
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('name', sa.String(length=80), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('key', sa.String(length=10), nullable=False),
    sa.Column('color', sa.String(length=7), nullable=False),
    sa.Column('next_number', sa.Integer(), server_default=sa.text('1'), nullable=False),
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id', 'key', name='uq_projects_user_key')
    )
    op.create_index(op.f('ix_projects_user_id'), 'projects', ['user_id'], unique=False)

    # --- Goals: optional project + ticket number ---
    op.add_column('goals', sa.Column('project_id', sa.UUID(), nullable=True))
    op.add_column('goals', sa.Column('number', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'goals_project_id_fkey', 'goals', 'projects', ['project_id'], ['id'], ondelete='SET NULL'
    )
    op.create_index(op.f('ix_goals_project_id'), 'goals', ['project_id'], unique=False)

    # Existing goals are all unassigned: number them TBD-1..n per user by creation time.
    op.execute("""
        UPDATE goals g SET number = sub.rn
        FROM (
            SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY created_at, id) AS rn
            FROM goals
        ) sub
        WHERE g.id = sub.id
    """)
    op.execute("""
        UPDATE boards b SET next_unassigned_number = COALESCE(
            (SELECT max(number) FROM goals g WHERE g.user_id = b.user_id), 0
        ) + 1
    """)
    op.alter_column('goals', 'number', nullable=False)
    op.create_unique_constraint('uq_goals_project_number', 'goals', ['project_id', 'number'])
    op.create_index(
        'uq_goals_user_unassigned_number', 'goals', ['user_id', 'number'],
        unique=True, postgresql_where=sa.text('project_id IS NULL'),
    )

    # --- Add "Ready" after the first column on boards that lack one. ---
    boards = conn.execute(sa.text("""
        SELECT b.id FROM boards b
        WHERE NOT EXISTS (
            SELECT 1 FROM columns c WHERE c.board_id = b.id AND lower(c.name) = 'ready'
        )
    """)).fetchall()
    for (board_id,) in boards:
        conn.execute(
            sa.text("UPDATE columns SET position = position + 1 WHERE board_id = :b AND position >= 1"),
            {"b": board_id},
        )
        count = conn.execute(
            sa.text("SELECT count(*) FROM columns WHERE board_id = :b"), {"b": board_id}
        ).scalar_one()
        conn.execute(
            sa.text(
                "INSERT INTO columns (id, board_id, name, position, kind) "
                "VALUES (:id, :b, 'Ready', :pos, 'NORMAL')"
            ),
            {"id": uuid7(), "b": board_id, "pos": min(1, count)},
        )


def downgrade() -> None:
    """Downgrade schema. The Ready columns are left in place (they're ordinary columns)."""
    op.drop_index('uq_goals_user_unassigned_number', table_name='goals')
    op.drop_constraint('uq_goals_project_number', 'goals', type_='unique')
    op.drop_index(op.f('ix_goals_project_id'), table_name='goals')
    op.drop_constraint('goals_project_id_fkey', 'goals', type_='foreignkey')
    op.drop_column('goals', 'number')
    op.drop_column('goals', 'project_id')
    op.drop_index(op.f('ix_projects_user_id'), table_name='projects')
    op.drop_table('projects')
    op.drop_column('boards', 'next_unassigned_number')
    op.add_column('boards', sa.Column(
        'position', sa.Integer(), server_default=sa.text('0'), nullable=False
    ))
    op.drop_constraint('uq_boards_user_id', 'boards', type_='unique')
    op.create_index(op.f('ix_boards_user_id'), 'boards', ['user_id'], unique=False)
