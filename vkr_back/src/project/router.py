from fastapi.routing import APIRouter
from fastapi import Body, status, Query
from fastapi.responses import JSONResponse
from src.project.schemas import NewProject, ProjectResponse
from typing import List
from src.database import get_db_session
from src.project.utils import (
    create_new_project, 
    add_user_to_project,
    get_projects,
    get_projects_by_user_id
)

router = APIRouter(
    tags=["projects"]
)
        

@router.get("/projects")
def get_all_projects(user_id: int | None = Query(None)) -> List[ProjectResponse]:
    with get_db_session() as session:
        if user_id:
            projects = get_projects_by_user_id(user_id, session)
        else:
            projects = get_projects(session)
        return [ProjectResponse(**project.__dict__) for project in projects]
        
        
@router.post("/project")
def create_project(project: NewProject = Body(...)):
    with get_db_session() as session:
        create_new_project(project, session)
        return JSONResponse(status_code=status.HTTP_201_CREATED, content={"message": "Project created successfully"})
    

@router.post("/project/asignee")
def add_user_to_project(project_id: int = Query(...), user_id: int | list[int] = Query(...)):
    with get_db_session() as session:
        if isinstance(user_id, int):
            add_user_to_project(project_id, user_id, session)
        else:
            for user in user_id:
                add_user_to_project(project_id, user, session)
        return JSONResponse(status_code=status.HTTP_201_CREATED, content={"message": "User added to project successfully"})
        
    
    