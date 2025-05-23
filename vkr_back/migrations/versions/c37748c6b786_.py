"""empty message

Revision ID: c37748c6b786
Revises: cbf397ac4454
Create Date: 2025-03-26 01:02:29.672782

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c37748c6b786'
down_revision: Union[str, None] = 'cbf397ac4454'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('task_asignees', 'task_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('task_asignees', 'executor_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    op.alter_column('task_asignees', 'requestor_id',
               existing_type=sa.INTEGER(),
               nullable=False)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('task_asignees', 'requestor_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.alter_column('task_asignees', 'executor_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    op.alter_column('task_asignees', 'task_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    # ### end Alembic commands ###
