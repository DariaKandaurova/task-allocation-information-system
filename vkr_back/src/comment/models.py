from src.database import Base
from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import mapped_column, relationship
from datetime import datetime


class Comment(Base):
    __tablename__ = "comments"
    
    id = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = mapped_column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"))
    user_id = mapped_column(Integer, ForeignKey("users.id"))
    text = mapped_column(String)
    created_at = mapped_column(DateTime(timezone=True), default=datetime.now().astimezone())
    updated_at = mapped_column(DateTime(timezone=True), default=datetime.now().astimezone())
    
    attachments = relationship("Attachment", backref="comment", cascade="all, delete", passive_deletes=True)
    
    
    def __repr__(self):
        return f"Comment(id={self.id}, task_id={self.task_id}, user_id={self.user_id}, text={self.text}, created_at={self.created_at}, updated_at={self.updated_at})"
    
    def __str__(self):
        return self.text
    
    
    
    
metadata = Base.metadata