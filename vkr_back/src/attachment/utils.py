from src.attachment.models import Attachment
from sqlalchemy.orm import Session
from src.task.models import ChangeTaskHistory
from fastapi import UploadFile
import os
from datetime import datetime

def get_file_names_by_task_id(task_id: str, db_session: Session):
    attachments = db_session.query(Attachment).filter(Attachment.task_id == task_id).all()
    file_names = [{'id': attachment.id, 'file_name': attachment.file_name} for attachment in attachments]
    
    return file_names


async def add_attachment_to_task(task_id: int, attachment: UploadFile, current_user: str, db_session: Session):
    try:
        if not os.path.exists(f"attachments/tasks/{task_id}"):
            os.makedirs(f"attachments/tasks/{task_id}")
        file_path = f"attachments/tasks/{task_id}/{attachment.filename}"
        with open(file_path, "wb") as f:
            f.write(await attachment.read())
            
        attachment = Attachment(
            task_id = task_id,
            file_path = file_path,
            file_name = attachment.filename,
        )
        db_session.add(attachment)
        db_session.commit()
        change_task_history = ChangeTaskHistory(
            task_id = task_id,
            type = "attachment",
            data = f"Добавлен файл {attachment.file_name} в задачу",
            created_at = datetime.now().astimezone(),
            user_name = current_user,
        )
        db_session.add(change_task_history)
        db_session.commit()
    except Exception as e:
        print(e)
    
async def add_attachment_to_comment(comment_id: int, attachment: UploadFile, current_user: str, db_session: Session):
    try:
        if not os.path.exists(f"attachments/comments/{comment_id}"):
            os.makedirs(f"attachments/comments/{comment_id}")
        file_path = f"attachments/comments/{comment_id}/{attachment.filename}"
        with open(file_path, "wb") as f:
            f.write(await attachment.read())
            
        attachment = Attachment(
            comment_id = comment_id,
            file_path = file_path,
            file_name = attachment.filename,
        )
        db_session.add(attachment)
        db_session.commit()
        change_task_history = ChangeTaskHistory(
            task_id = comment_id,
            type = "attachment",
            data = f"Добавлен файл {attachment.file_name} в комментарий",
            created_at = datetime.now().astimezone(),
            user_name = current_user,
        )
        db_session.add(change_task_history)
        db_session.commit()
    except Exception as e:
        print(e)

async def update_attachments_by_task_id(task_id: str, attachments: UploadFile, db_session: Session):
    old_attachments = db_session.query(Attachment).filter(Attachment.task_id == task_id).all()
    for attachment in old_attachments:
        os.remove(attachment.file_path)
        db_session.delete(attachment)
    file_dir = '/'.join(attachment.file_path.split("/")[:-1])
    if not os.listdir(file_dir):
        os.rmdir(file_dir)
    db_session.commit()
    change_task_history = ChangeTaskHistory(
        task_id = task_id,
        type = "attachment",
        data = f"Файлы задачи обновлены",
        created_at = datetime.now().astimezone()
    )
    db_session.add(change_task_history)
    db_session.commit()
    await add_attachment_to_task(task_id, attachments, db_session)
    
    
        
def get_attachment_by_id(attachment_id: str, db_session: Session):
    attachment = db_session.query(Attachment).filter(Attachment.id == attachment_id).first()
    return attachment
    
    
def delete_attachment_by_id(attachment_id: str, db_session: Session):
    attachment = db_session.query(Attachment).filter(Attachment.id == attachment_id).first()
    os.remove(attachment.file_path)
    file_dir = '/'.join(attachment.file_path.split("/")[:-1])
    if not os.listdir(file_dir):
        os.rmdir(file_dir)
    db_session.delete(attachment)
    db_session.commit()
    
