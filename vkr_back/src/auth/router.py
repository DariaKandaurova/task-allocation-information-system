from fastapi.routing import APIRouter
from typing import List, Literal
from src.auth.schemas import LoginUser, JiraUserResponse, NewJiraUser, JiraUserResponseDetailed, EmployeeResponse
from fastapi import Request, status, Query, Path, Body
from fastapi.responses import JSONResponse
from src.auth.utils import (
    check_credentials, 
    update_jira_user_status,
    delete_jira_user,
    add_jira_user,
    update_jira_user_role,
    get_all_users,
    get_user_by_email,
    get_all_employees
)
from src.project.utils import add_user_to_project
from src.database import get_db_session

router = APIRouter(
    tags=["auth/users"]
)

@router.post("/login")
def login(user: LoginUser = Body(...)):
    with get_db_session() as session:
        if check_credentials(user, session):
            update_jira_user_status(user_email=user.email, status='logged_in', db_session=session)
            jira_user = get_user_by_email(user.email, session)
            user_data = get_all_users(session, jira_user.id)
            return JiraUserResponse(**user_data[0])
        return JSONResponse(status_code=status.HTTP_401_UNAUTHORIZED, content={"message": "Invalid credentials"})
  
    
@router.get("/logout")
def logout(user_id: int = Query(...)):
    with get_db_session() as session:
        update_jira_user_status(user_id=user_id, status='logged_out', db_session=session)
        return JSONResponse(status_code=status.HTTP_200_OK, content={"message": "Logout successful"})
    

@router.get('/users')
def get_users(
    user_id: int | None = Query(None), 
    detailed: bool = Query(False),
    type: Literal['user', 'employee'] = Query(default='user'),
    mybabies: bool = Query(False),
    difficulty: int | None = Query(None)) -> List[JiraUserResponse] | List[JiraUserResponseDetailed] | List[EmployeeResponse] | dict:
    with get_db_session() as session:
        if type == 'employee':
            users = get_all_employees(session)
            return [EmployeeResponse(**user.__dict__) for user in users]
        if detailed:
            if user_id:
                users = get_all_users(session, user_id)
                return [JiraUserResponseDetailed(**user) for user in users]
            users = get_all_users(session)
            return [JiraUserResponseDetailed(**user) for user in users]
        else:
            if user_id:
                if mybabies:
                    users = get_all_users(session, user_id=user_id, mybabies=True, difficulty=difficulty)
                    return users
                users = get_all_users(session, user_id)
                return [JiraUserResponse(**user) for user in users]
            users = get_all_users(session)
            return [JiraUserResponse(**user) for user in users]
    

@router.patch('/users/{user_id}')
def update_role(user_id: int = Path(...), role: str = Body(embed=True)):
    with get_db_session() as session:
        update_jira_user_role(user_id, role, session)
        return JSONResponse(status_code=status.HTTP_200_OK, content={"message": "User role updated successfully"})
    

@router.delete('/users/{user_id}')
def delete_user(user_id: int = Path(...)):
    with get_db_session() as session:
        delete_jira_user(user_id, session)
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content={"message": "User deleted successfully"})
    

@router.post('/users')
def create_jira_user(request: Request, user: NewJiraUser = Body(...)):
    with get_db_session() as session:
        print(user)
        user_id = add_jira_user(user, session)
        if user.project_id:
            add_user_to_project(user.project_id, user_id, session)
        return JSONResponse(status_code=status.HTTP_201_CREATED, content={"message": "User created successfully"})