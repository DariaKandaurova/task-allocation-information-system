from sqlalchemy import Integer, String, DateTime, ForeignKey, Date, Float
from sqlalchemy.orm import mapped_column, relationship
from datetime import datetime, date

from src.database import Base


class JiraUser(Base):
    __tablename__ = "users"

    id = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    employee_id = mapped_column(Integer, ForeignKey("employees.id"), nullable=True)
    username = mapped_column(String, unique=True, index=True)
    email = mapped_column(String, nullable=False, unique=True, index=True)
    hashed_password = mapped_column(String)
    role = mapped_column(String)
    rating = mapped_column(Float, unique=False, default=0)
    status = mapped_column(String, default='logged_out')
    created_at = mapped_column(DateTime, default=datetime.now().astimezone())
    updated_at = mapped_column(DateTime, default=datetime.now().astimezone())
    
    def __repr__(self):
        return f"User(id={self.id}, username={self.username}, email={self.email}, role={self.role}, created_at={self.created_at}, updated_at={self.updated_at}, rating={self.rating})"
    
    def __str__(self):
        return f"User(id={self.id}, username={self.username}, email={self.email}, role={self.role}, created_at={self.created_at}, updated_at={self.updated_at}, rating={self.rating})"
    

class Employee(Base):
    __tablename__ = "employees"

    id = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    boss_id = mapped_column(Integer, ForeignKey("employees.id"), nullable=True)
    name = mapped_column(String, nullable=False, unique=False)
    department = mapped_column(String, nullable=False, unique=False)
    position = mapped_column(String, nullable=False, unique=False)
    experience = mapped_column(Float, nullable=True, unique=False)
    rating = mapped_column(Integer, nullable=True, unique=False, default=0)
    birthday = mapped_column(Date, nullable=True, unique=False)
    phone = mapped_column(String, nullable=True, unique=False)
    email = mapped_column(String, unique=True, index=True)
    hashed_password = mapped_column(String)
    created_at = mapped_column(DateTime, default=datetime.now().astimezone())
    updated_at = mapped_column(DateTime, default=datetime.now().astimezone())
    
    def __repr__(self):
        return f"Employee(id={self.id}, name={self.name})"
    
    def __str__(self):
        return f"Employee(id={self.id}, name={self.name}"
    
metadata = Base.metadata
    
