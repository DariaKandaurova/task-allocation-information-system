from pydantic import BaseModel
from typing import List
from datetime import datetime
    
    
class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str | None = None
    

class NewProject(BaseModel):
    user_id: int
    name: str
    description: str
    
