from fastapi import APIRouter, Query, Form, File, UploadFile, Body, Path
from typing import List
from fastapi.responses import JSONResponse
from fastapi import status
from pydantic import ValidationError
from src.task.utils import (
    get_tasks_by_project_and_requestor, 
    get_tasks_by_project_and_executor, 
    get_tasks_by_executor, 
    get_tasks_by_project, 
    get_task_by_id,
    create_new_task,
    update_task_status,
    delete_task_by_id,
    get_all_tags,
    update_task_by_id,
    get_history_by_task_id
)

from src.task.schemas import TaskResponse, NewTask
from src.database import get_db_session
from src.attachment.utils import add_attachment_to_task

router = APIRouter(
    tags=["tasks"]
)

@router.get("/tasks")
def get_tasks(user_id: int | None = Query(None), 
              project_id: int | None = Query(default=None),
              is_requestor: bool = Query(False)):
    with get_db_session() as session:
        if user_id and project_id:
            if is_requestor:
                tasks = get_tasks_by_project_and_requestor(project_id, user_id, db_session=session)
            else:
                tasks = get_tasks_by_project_and_executor(project_id, user_id, session)
        elif user_id:
            tasks = get_tasks_by_executor(user_id, session)
        else:
            tasks = get_tasks_by_project(project_id, session)
        
        return tasks
    

@router.get("/task")
def get_task(task_id: int = Query(...)) -> TaskResponse:
    with get_db_session() as session:
        task = get_task_by_id(task_id, session)
        if not task:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={"message": "Task not found"}
            )
        return task
    
    
@router.post("/task")
async def create_task(task = Form(...), attachments: List[UploadFile] | None  = File(None)):
    try:
        print(task)
        task = NewTask.model_validate_json(task)
        print(task)
    except ValidationError as e:
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": str(e)})
    
    with get_db_session() as session:
        task_id = create_new_task(task, session)
        if attachments:
            for attachment in attachments:
                await add_attachment_to_task(task_id, attachment, task.current_user, session)
        return JSONResponse(status_code=status.HTTP_201_CREATED, content={"message": "Task created successfully"})
    

@router.patch("/task/{task_id}")
def update_task(current_user: str | None = Body(embed=True), status: str = Body(embed=True), task_id: int = Path(...)):
    with get_db_session() as session:
        task = update_task_status(task_id, status, current_user, session)
        return task
    
    
@router.delete("/task/{task_id}")
def delete_task(task_id: int = Path(...)):
    with get_db_session() as session:
        delete_task_by_id(task_id, session)
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content={"message": "Task deleted successfully"})
    
    
@router.put("/task/{task_id}")
async def update_task(task_id: int = Path(...), task = Form(...), attachments: List[UploadFile] | None  = File(None)):
    try:
        task = NewTask.model_validate_json(task)
    except ValidationError as e:
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": str(e)})
    
    with get_db_session() as session:
        update_task_by_id(task_id, task, session)
        if attachments:
            for attachment in attachments:
                await add_attachment_to_task(task_id, attachment, task.current_user, session)
        updated_task = get_task_by_id(task_id, session)
        #return JSONResponse(status_code=status.HTTP_200_OK, content={"message": "Task updated successfully"})
        return updated_task



@router.get("/tags")
def get_tags():
    with get_db_session() as session:
        tags = get_all_tags(session)
        return [{'id': tag.id, 'name': tag.name} for tag in tags]
    

@router.get("/task/{task_id}/history")
def get_history(task_id: int = Path(...)):
    with get_db_session() as session:
        history = get_history_by_task_id(task_id, session)
        return history
