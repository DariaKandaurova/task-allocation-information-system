"""empty message

Revision ID: 72558a581fbd
Revises: 2056eed77237
Create Date: 2025-04-04 12:25:56.782656

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '72558a581fbd'
down_revision: Union[str, None] = '2056eed77237'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint('attachments_task_id_fkey', 'attachments', type_='foreignkey')
    op.drop_constraint('attachments_comment_id_fkey', 'attachments', type_='foreignkey')
    op.create_foreign_key(None, 'attachments', 'comments', ['comment_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(None, 'attachments', 'tasks', ['task_id'], ['id'], ondelete='CASCADE')
    op.drop_constraint('comments_task_id_fkey', 'comments', type_='foreignkey')
    op.create_foreign_key(None, 'comments', 'tasks', ['task_id'], ['id'], ondelete='CASCADE')
    op.drop_constraint('task_asignees_task_id_fkey', 'task_asignees', type_='foreignkey')
    op.create_foreign_key(None, 'task_asignees', 'tasks', ['task_id'], ['id'], ondelete='CASCADE')
    op.drop_constraint('task_tags_task_id_fkey', 'task_tags', type_='foreignkey')
    op.drop_constraint('task_tags_tag_id_fkey', 'task_tags', type_='foreignkey')
    op.create_foreign_key(None, 'task_tags', 'tasks', ['task_id'], ['id'], ondelete='CASCADE')
    op.create_foreign_key(None, 'task_tags', 'tags', ['tag_id'], ['id'], ondelete='CASCADE')
    op.drop_constraint('tasks_project_id_fkey', 'tasks', type_='foreignkey')
    op.create_foreign_key(None, 'tasks', 'projects', ['project_id'], ['id'], ondelete='CASCADE')
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_constraint(None, 'tasks', type_='foreignkey')
    op.create_foreign_key('tasks_project_id_fkey', 'tasks', 'projects', ['project_id'], ['id'])
    op.drop_constraint(None, 'task_tags', type_='foreignkey')
    op.drop_constraint(None, 'task_tags', type_='foreignkey')
    op.create_foreign_key('task_tags_tag_id_fkey', 'task_tags', 'tags', ['tag_id'], ['id'])
    op.create_foreign_key('task_tags_task_id_fkey', 'task_tags', 'tasks', ['task_id'], ['id'])
    op.drop_constraint(None, 'task_asignees', type_='foreignkey')
    op.create_foreign_key('task_asignees_task_id_fkey', 'task_asignees', 'tasks', ['task_id'], ['id'])
    op.drop_constraint(None, 'comments', type_='foreignkey')
    op.create_foreign_key('comments_task_id_fkey', 'comments', 'tasks', ['task_id'], ['id'])
    op.drop_constraint(None, 'attachments', type_='foreignkey')
    op.drop_constraint(None, 'attachments', type_='foreignkey')
    op.create_foreign_key('attachments_comment_id_fkey', 'attachments', 'comments', ['comment_id'], ['id'])
    op.create_foreign_key('attachments_task_id_fkey', 'attachments', 'tasks', ['task_id'], ['id'])
    # ### end Alembic commands ###
