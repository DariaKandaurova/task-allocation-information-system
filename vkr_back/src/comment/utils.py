from src.comment.models import Comment
from src.auth.models import JiraUser, Employee
from src.comment.schemas import NewComment, CommentResponse
from src.task.models import ChangeTaskHistory
from src.attachment.models import Attachment
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from copy import deepcopy

def create_comment(comment: NewComment, db_session: Session) -> int:
    db_comment = Comment(
        task_id=comment.task_id,
        user_id=comment.user_id,
        text=comment.text,
        updated_at=datetime.now().astimezone(),
        created_at=datetime.now().astimezone()
    )
    db_session.add(db_comment)
    change_task_history = ChangeTaskHistory(
        task_id = comment.task_id,
        type = "comment",
        user_name = comment.current_user,
        data = f"Добавлен комментарий {db_comment.text}",
        created_at = datetime.now().astimezone()
        
    )
    db_session.add(change_task_history)
    db_session.commit()
    db_session.refresh(db_comment)
    return db_comment.id


def get_comments_by_task_id(task_id: int, db_session: Session) -> List[CommentResponse]:
    comments = db_session.query(Comment, JiraUser.id, Employee.name).join(JiraUser, Comment.user_id == JiraUser.id).join(Employee, JiraUser.employee_id == Employee.id).filter(Comment.task_id == task_id).all()
    print(comments)
    
    return [CommentResponse(id=comment[0].id, task_id=comment[0].task_id, user_name=comment[2], text=comment[0].text, updated_at=comment[0].updated_at, attachments=get_file_names_by_comment_id(comment[0].id, db_session)) for comment in comments]


def update_comment_by_id(comment_id: int, text: str, db_session: Session) -> None:
    db_comment = db_session.query(Comment).filter(Comment.id == comment_id).first()
    old_comment = deepcopy(db_comment)
    db_comment.text = text
    db_comment.updated_at = datetime.now().astimezone()
    db_session.commit()
    db_session.refresh(db_comment)
    if old_comment.text != text:
        change_task_history = ChangeTaskHistory(
            task_id = db_comment.task_id,
            type = "comment",
            data = f"Комментарий обновлен. Изменения: {old_comment.text} -> {text}",
            created_at = datetime.now().astimezone()
        )
        db_session.add(change_task_history)
        db_session.commit()


def delete_comment_by_id(comment_id: int, db_session: Session) -> None:
    db_comment = db_session.query(Comment).filter(Comment.id == comment_id).first()
    db_session.delete(db_comment)
    db_session.commit()
    change_task_history = ChangeTaskHistory(
        task_id = db_comment.task_id,
        type = "comment",
        data = f"Комментарий от {db_comment.updated_at} удален",
        created_at = datetime.now().astimezone()
    )
    db_session.add(change_task_history)
    db_session.commit()
    
def get_file_names_by_comment_id(comment_id: int, db_session: Session) -> List[str]:
    attachments = db_session.query(Attachment).filter(Attachment.comment_id == comment_id).all()
    return [{'id': attachment.id, 'file_name': attachment.file_name} for attachment in attachments]

