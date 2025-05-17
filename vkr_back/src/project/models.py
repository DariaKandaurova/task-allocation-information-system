from sqlalchemy import Integer, String, DateTime, ForeignKey, Date
from sqlalchemy.orm import mapped_column, relationship
from datetime import datetime

from src.database import Base

class Project(Base):
    __tablename__ = "projects"
    
    id = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    name = mapped_column(String, unique=True, index=True)
    description = mapped_column(String)
    created_at = mapped_column(DateTime(timezone=True), default=datetime.now().astimezone())
    updated_at = mapped_column(DateTime(timezone=True), default=datetime.now().astimezone())
    
    tasks = relationship("Task", backref="project", cascade="all, delete", passive_deletes=True)
    
    
class ProjectAsignee(Base):
    __tablename__ = "project_asignees"
    
    id = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = mapped_column(Integer, ForeignKey("projects.id", ondelete='CASCADE'))
    user_id = mapped_column(Integer, ForeignKey("users.id", ondelete='CASCADE'))
   
    
class Board(Base):
    __tablename__ = "boards"
    
    id = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    project_id = mapped_column(Integer, ForeignKey("projects.id"))
    name = mapped_column(String, unique=True, index=True)
    description = mapped_column(String)
    
    
class Tempo(Base):
    __tablename__ = "tempo"
    
    id = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    task_id = mapped_column(Integer, ForeignKey("tasks.id"))
    user_id = mapped_column(Integer, ForeignKey("users.id"))
    description = mapped_column(String, default=f"Время потрачено на задачу {task_id}")
    date = mapped_column(Date, nullable=False)
    time_spent = mapped_column(Integer, nullable=False)
    created_at = mapped_column(DateTime(timezone=True), default=datetime.now().astimezone())
    updated_at = mapped_column(DateTime(timezone=True), default=datetime.now().astimezone())
    
metadata = Base.metadata
     