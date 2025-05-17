from pydantic import BaseModel
from datetime import datetime
from typing import List


class NewComment(BaseModel):
    task_id: int
    user_id: int
    text: str
    current_user: str | None = None

class CommentResponse(BaseModel):
    id: int
    task_id: int
    user_name: str
    text: str
    updated_at: datetime
    attachments: List[dict] | None = None