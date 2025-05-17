from pydantic import BaseModel
from typing import List
from datetime import datetime, date


class NewJiraUser(BaseModel):
    email: str
    password: str | None = None
    role: str
    project_id: int
    

class LoginUser(BaseModel):
    email: str
    password: str
    
    
class JiraUserResponse(BaseModel):
    id: int
    username: str | None = None
    name: str | None = None
    email: str | None = None
    role: str | None = None
    status: str | None = None
    rating: float | None = None
    phone: str | None = None
    position: str | None = None
    department: str | None = None
    tasks: int | None = None
    
    
class JiraUserResponseDetailed(JiraUserResponse):
    name: str
    department: str
    position: str
    experience: float
    rating: int | None = None
    birthday: datetime
    phone: str
    
    
class EmployeeResponse(BaseModel):
    id: int
    name: str
    email: str
    department: str
    position: str