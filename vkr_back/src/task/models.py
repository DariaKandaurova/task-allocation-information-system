from sqlalchemy import Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import  mapped_column, relationship
from sqlalchemy.dialects.postgresql import ARRAY
from src.database import Base
from datetime import datetime

class Task(Base):
    __tablename__ = "tasks"
    
    id = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = mapped_column(Integer, ForeignKey("projects.id", ondelete="CASCADE"))
    title = mapped_column(String, unique=False)
    description = mapped_column(String)
    tags = mapped_column(ARRAY(String), nullable=True)
    epic_task_id = mapped_column(Integer, ForeignKey("tasks.id"), nullable=True)
    difficulty = mapped_column(Integer, nullable=True)
    priority = mapped_column(String)
    status = mapped_column(String)
    due_date = mapped_column(DateTime(timezone=True))
    created_at = mapped_column(DateTime(timezone=True), default=datetime.now().astimezone())
    updated_at = mapped_column(DateTime(timezone=True), default=datetime.now().astimezone())
    update_wait_time = mapped_column(DateTime(timezone=True), nullable=True)
    update_in_progress_time = mapped_column(DateTime(timezone=True), nullable=True)
    update_done_time = mapped_column(DateTime(timezone=True), nullable=True)
    
    comments = relationship("Comment", backref="task", cascade="all, delete", passive_deletes=True)
    asignees = relationship("TaskAsignee", backref="task", cascade="all, delete", passive_deletes=True)
    attachments = relationship("Attachment", backref="task", cascade="all, delete", passive_deletes=True)
    task_tags = relationship("TaskTag", backref="task", cascade="all, delete", passive_deletes=True)
    
    def __repr__(self):
        return f"Task(id={self.id}, title={self.title}, description={self.description}, priority={self.priority}, status={self.status}, due_date={self.due_date}, created_at={self.created_at}, updated_at={self.updated_at})"
    
    
class TaskAsignee(Base):
    __tablename__ = "task_asignees"
    
    id = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = mapped_column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    executor_id = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    requestor_id = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    
    def __repr__(self):
        return f"TaskAsignee(id={self.id}, task_id={self.task_id}, executor_id={self.executor_id}, requestor_id={self.requestor_id})"
    
    
class Tag(Base):
    __tablename__ = "tags"
    
    id = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name = mapped_column(String, unique=True)
    
    task_tags = relationship("TaskTag", backref="tag", cascade="all, delete", passive_deletes=True)
    
    def __repr__(self):
        return f"Tag(id={self.id}, name={self.name})"
    
    
class TaskTag(Base):
    __tablename__ = "task_tags"
    
    id = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = mapped_column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    tag_id = mapped_column(Integer, ForeignKey("tags.id", ondelete="CASCADE"), nullable=False)
    
    def __repr__(self):
        return f"TaskTag(id={self.id}, task_id={self.task_id}, tag_id={self.tag_id})"
    
    
class ChangeTaskHistory(Base):
    __tablename__ = "change_task_history"
    
    id = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = mapped_column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    user_name = mapped_column(String)
    type = mapped_column(String)
    data = mapped_column(String)
    created_at = mapped_column(DateTime(timezone=True), default=datetime.now().astimezone())
    
    def __repr__(self):
        return f"ChangeTaskHistory(id={self.id}, task_id={self.task_id}, type={self.type}, data={self.data}, created_at={self.created_at})"


metadata = Base.metadata