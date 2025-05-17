from pydantic import BaseModel
from typing import List
from datetime import datetime


class NewTask(BaseModel):
    project_id: int
    executor_id: int
    requestor_id: int
    title: str
    tag_ids: list[int] | None = None
    tag_names: list[str] | None = None
    epic_task_id: int | None = None
    difficulty: int | None = None
    description: str
    priority: str
    due_date: datetime
    status: str = 'Новые'
    current_user: str | None = None

    
class TaskPreviewResponse(BaseModel):
    id: int
    title: str
    requestor_name: str
    executor_name: str
    status: str
    priority: str
    due_date: datetime
    difficulty: int | None = None
    tags: list[dict] | None = None
    
class TaskResponse(TaskPreviewResponse):
    description: str
    attachments: list[dict] | None = None
    epic_task_id: int | None = None
    related_tasks: list[dict] | None = None
    