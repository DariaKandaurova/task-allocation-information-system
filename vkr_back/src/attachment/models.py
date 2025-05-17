from src.database import Base
from sqlalchemy.orm import mapped_column
from sqlalchemy import Integer, String, DateTime, ForeignKey, Boolean
from datetime import datetime


class Attachment(Base):
    
    __tablename__ = "attachments"
    
    id = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = mapped_column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=True)
    comment_id = mapped_column(Integer, ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    file_path = mapped_column(String, nullable=False, unique=True)
    file_name = mapped_column(String, nullable=False, unique=False)
    created_at = mapped_column(DateTime(timezone=True), default=datetime.now().astimezone())
    updated_at = mapped_column(DateTime(timezone=True), default=datetime.now().astimezone())
    
    def __repr__(self):
        return f"Attachment(id={self.id}, task_id={self.task_id}, file_path={self.file_path}, file_name={self.file_name}, created_at={self.created_at}, updated_at={self.updated_at})"


metadata = Base.metadata