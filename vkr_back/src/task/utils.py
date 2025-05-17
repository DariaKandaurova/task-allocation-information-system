from sqlalchemy import Row
from src.task.models import Task, TaskAsignee, Tag, ChangeTaskHistory
from src.project.models import ProjectAsignee
from sqlalchemy.orm import Session, aliased
from sqlalchemy import func, case, select
from src.task.schemas import NewTask, TaskResponse, TaskPreviewResponse
from src.auth.models import Employee, JiraUser
from src.auth.utils import get_employee_id_by_user_id
from typing import List, Type
from src.attachment.utils import get_file_names_by_task_id
from pydantic import BaseModel
from src.constants import compare_position_to_nums
from datetime import datetime
from copy import deepcopy

def create_new_task(new_task: NewTask, db_session: Session) -> int:
    if new_task.tag_names:
        new_tags = [Tag(name=tag) for tag in new_task.tag_names]
        db_session.add_all(new_tags)
        db_session.flush()
        if new_task.tag_ids:
            new_task.tag_ids = new_task.tag_ids + [tag.id for tag in new_tags]
        else:
            new_task.tag_ids = [tag.id for tag in new_tags]
        
    task = Task(
        project_id=new_task.project_id,
        title = new_task.title,
        description = new_task.description,
        priority = new_task.priority,
        tags = new_task.tag_ids,
        epic_task_id = new_task.epic_task_id,
        status = new_task.status,
        due_date = new_task.due_date,
        difficulty = new_task.difficulty
    )
    db_session.add(task)
    db_session.flush()
    
    task_asignee = TaskAsignee(
        task_id = task.id,
        executor_id = new_task.executor_id,
        requestor_id = new_task.requestor_id
    ) 
    
    project_asignee = ProjectAsignee(
        project_id = new_task.project_id,
        user_id = new_task.executor_id
    )
    
    change_task_history = ChangeTaskHistory(
        task_id = task.id,
        type = "create",
        user_name = new_task.current_user,
        data = f"Создана задача {task.title}",
        created_at = datetime.now().astimezone()
    )
    
    db_session.add(task_asignee)
    db_session.add(project_asignee)
    db_session.add(change_task_history)
    db_session.commit()
    
    return task.id


def get_all_tasks_query(db_session: Session):
    executor_alias = aliased(JiraUser)
    requestor_alias = aliased(JiraUser)
    
    executor_employee = aliased(Employee)
    requestor_employee = aliased(Employee)
    
    query = db_session.query(
        Task.id,
        Task.title,
        Task.description,
        requestor_employee.name.label("requestor_name"),
        executor_employee.name.label("executor_name"),
        Task.status,
        Task.priority,
        Task.difficulty,
        Task.due_date,
        Task.updated_at,
	Task.epic_task_id
    ).join(TaskAsignee, Task.id == TaskAsignee.task_id) \
     .join(executor_alias, executor_alias.id == TaskAsignee.executor_id) \
     .join(requestor_alias, requestor_alias.id == TaskAsignee.requestor_id) \
     .join(executor_employee, executor_employee.id == executor_alias.employee_id) \
     .join(requestor_employee, requestor_employee.id == requestor_alias.employee_id)
    
    return (query, requestor_alias, executor_alias)


def convert_tasks_to_response(tasks_data: List[Row] | Row, response_model: Type[BaseModel], db_session: Session) -> List[TaskResponse] | List[TaskPreviewResponse]:
    if isinstance(tasks_data, Row):
        return response_model(**tasks_data._mapping, tags=get_tag_names_by_task_id(tasks_data.id, db_session))
    return [response_model(**row._mapping, tags=get_tag_names_by_task_id(row.id, db_session)) for row in tasks_data]
    

def get_tasks_by_project(project_id: str, db_session: Session) -> List[TaskPreviewResponse]:
    tasks_query, _, _ = get_all_tasks_query(db_session)
    tasks_data = tasks_query.filter(Task.project_id == project_id).all()
    
    tasks_preview = convert_tasks_to_response(tasks_data, TaskPreviewResponse, db_session)

    
    return tasks_preview

def get_tasks_by_executor(executor_id: str, db_session: Session) -> List[TaskPreviewResponse]:
    tasks_query, _, executor_alias = get_all_tasks_query(db_session)
    tasks_data = tasks_query.filter(executor_alias.id == executor_id).all()
    
    tasks_preview = convert_tasks_to_response(tasks_data, TaskPreviewResponse, db_session)

    
    return tasks_preview


def get_tasks_by_requestor(requestor_id: str, db_session: Session) -> List[TaskPreviewResponse]:
    tasks_query, requestor_alias, _ = get_all_tasks_query(db_session)
    tasks_data = tasks_query.filter(requestor_alias.id == requestor_id).all()
    
    tasks_preview = convert_tasks_to_response(tasks_data, TaskPreviewResponse, db_session)
    
    return tasks_preview



def get_tasks_by_project_and_executor(project_id: str, 
                                      executor_id: str, 
                                      db_session: Session):
    tasks_query, requestor_alias, executor_alias = get_all_tasks_query(db_session)
    tasks_data = tasks_query.filter(Task.project_id == project_id).filter(executor_alias.id == executor_id).all()
    
    tasks_preview = convert_tasks_to_response(tasks_data, TaskPreviewResponse, db_session)
    
    return tasks_preview


def get_tasks_by_project_and_requestor(project_id: int, 
                                      requestor_id: int, 
                                      difficulty: list[int] | None = None,
                                      priority: list[str] | None = None,
                                      tag: list[str] | None = None,
                                      db_session: Session = None) -> List[TaskPreviewResponse]:
    tasks_query, requestor_alias, executor_alias = get_all_tasks_query(db_session)
    tasks_data: List[Row] = tasks_query.filter(Task.project_id == project_id).filter(requestor_alias.id == requestor_id)
    if difficulty:
        tasks_data = tasks_data.filter(Task.difficulty.in_(difficulty))
    if priority:
        tasks_data = tasks_data.filter(Task.priority.in_(priority))
    if tag:
        tasks_data = tasks_data.filter(Task.tag.in_(tag))
    tasks_data = tasks_data.all()
    
    tasks_preview = convert_tasks_to_response(tasks_data, TaskPreviewResponse, db_session)
    
    return tasks_preview



def get_task_by_id(task_id: int, db_session: Session) -> TaskResponse:
    tasks_query, _, _  = get_all_tasks_query(db_session)
    task = tasks_query.filter(Task.id == task_id).first()
    
    if task:
        task_preview = convert_tasks_to_response(task, TaskResponse, db_session)
        task_preview.attachments = get_file_names_by_task_id(task_id, db_session)
        task_preview.tags = get_tag_names_by_task_id(task.id, db_session)
        task_preview.related_tasks = get_related_tasks_by_task_id(task.id, db_session)
        print(task_preview.related_tasks)
        return task_preview
    return None


def update_task_status(task_id: int, status: str, current_user: str, db_session: Session):
    print(status)
    task = db_session.query(Task).filter(Task.id == task_id).first()
    task.status = status
    updated_at = datetime.now().astimezone()
    if status == 'Ожидающие':
        task.update_wait_time = updated_at
        task.updated_at = updated_at
    elif status == 'В работе':
        task.update_in_progress_time = updated_at
        task.updated_at = updated_at
    elif status == 'Выполнена':
        task.update_done_time = updated_at
        task.updated_at = updated_at
        db_session.commit()
        user_id = db_session.query(TaskAsignee).filter(TaskAsignee.task_id == task_id).first().executor_id
        user = db_session.query(JiraUser).filter(JiraUser.id == user_id).first()
        subq = (
        select(Task.difficulty)
            .join(TaskAsignee, Task.id == TaskAsignee.task_id)
            .where(
                TaskAsignee.executor_id == user_id,
                Task.status == 'Выполнена',                # или ваш признак
                Task.update_done_time.isnot(None)
            )
            .order_by(Task.update_done_time.desc())
            .limit(20)
            .subquery()
        )

        # Затем — среднее по этому подзапросу
        avg_difficulty = db_session.scalar(
            select(func.avg(subq.c.difficulty))
        )
        
        # subquery = (db_session \
        #     .query(TaskAsignee.task_id, TaskAsignee.executor_id, Task.due_date, Task.update_done_time) \
        #     .join(Task, Task.id == TaskAsignee.task_id) \
        #     .filter(TaskAsignee.executor_id == user_id) \
        #     .filter(Task.status == 'Выполнена') \
        #     .order_by(Task.update_done_time.desc()) \
        #     .limit(20) \
        #     .subquery()
        # )
        
        # result = db_session.query(
        #     func.count().label('total'),
        #     func.sum(
        #         case(
        #             (subquery.c.update_done_time <= task.due_date, 1),
        #             else_=0
        #         )
        #     ).label('done')
        # ).select_from(subquery).first()
        
        employee_id = get_employee_id_by_user_id(user.id, db_session)
        employee = db_session.query(Employee).filter(Employee.id == employee_id).first()
        experirnce_norm = min(employee.experience / 10, 1)
        position_norm = (compare_position_to_nums[employee.position.lower().split()[0]] - 1) / 4
        difficulty_norm = (avg_difficulty - 1) / 4
        user.rating = 1 + 9* (0.2 * experirnce_norm + 0.35 * position_norm + 0.45 * difficulty_norm)
        db_session.commit()
        return
        
    db_session.commit()
    print(current_user)
    
    change_task_history = ChangeTaskHistory(
        task_id = task.id,
        type = "update",
        user_name = current_user,
        data = f"Статус задачи изменен на {status}",
        created_at = datetime.now().astimezone()
    )
    db_session.add(change_task_history)
    db_session.commit()
    
    task = get_task_by_id(task_id, db_session)
    
    return task


def update_task_by_id(task_id: int, update_task: NewTask, db_session: Session):
    if update_task.tag_names:
        new_tags = [Tag(name=tag) for tag in update_task.tag_names]
        db_session.add_all(new_tags)
        db_session.flush()
        if update_task.tag_ids:
            update_task.tag_ids = update_task.tag_ids + [tag.id for tag in new_tags]
        else:
            update_task.tag_ids = [tag.id for tag in new_tags]
        
    task = db_session.query(Task).filter(Task.id == task_id).first()
    old_task = deepcopy(task)
    task.project_id = update_task.project_id
    task.title = update_task.title
    task.description = update_task.description
    task.priority = update_task.priority
    task.tags = update_task.tag_ids
    task.epic_task_id = update_task.epic_task_id
    task.status = update_task.status
    task.due_date = update_task.due_date
    task.difficulty = update_task.difficulty
    
    db_session.add(task)
    
    task_asignee = db_session.query(TaskAsignee).filter(TaskAsignee.task_id == task_id).first()
    task_asignee.executor_id = update_task.executor_id
    task_asignee.requestor_id = update_task.requestor_id
    db_session.add(task_asignee)
    data = f"Задача обновлена. Изменения: {', '.join([f'{key}: {old_task.__dict__[key]} -> {update_task.__dict__[key]}' for key, value in update_task.__dict__.items() if old_task.__dict__.get(key) and old_task.__dict__.get(key) != update_task.__dict__.get(key)])}"
    if data == "Задача обновлена. Изменения: ":
        data = None
        
    if data:
        change_task_history = ChangeTaskHistory(
            task_id = task.id,
            type = "update",
            user_name = update_task.current_user,
            data = data,
            created_at = datetime.now().astimezone()
        )
        db_session.add(change_task_history)
    db_session.commit()


def delete_task_by_id(task_id: int, db_session: Session):
    asignee = db_session.query(TaskAsignee).filter(TaskAsignee.task_id == task_id).first()
    db_session.delete(asignee)
    db_session.commit()
    history = db_session.query(ChangeTaskHistory).filter(ChangeTaskHistory.task_id == task_id).all()
    for h in history:
        db_session.delete(h)
    db_session.commit()
    task = db_session.query(Task).filter(Task.id == task_id).first()
    db_session.delete(task)
    db_session.commit()
    

def get_all_tags(db_session: Session) -> List[Tag]:
    tags = db_session.query(Tag).all()
    return tags


def get_tag_names_by_task_id(task_id: int, db_session: Session) -> List[str]:
    tags = db_session.query(Task).filter(Task.id == task_id).first().tags
    if tags:
        
        tag_names = [{'id': tag, 'name': db_session.query(Tag).filter(Tag.id == tag).first().name} for tag in tags]
        return tag_names
    return []

def get_related_tasks_by_task_id(task_id: int, db_session: Session):
    tasks = db_session.query(Task.id, Task.title).filter(Task.epic_task_id == task_id).all()
    return [{"id": task.id, "title": task.title} for task in tasks]


def get_history_by_task_id(task_id: int, db_session: Session):
    history = db_session.query(ChangeTaskHistory).filter(ChangeTaskHistory.task_id == task_id).order_by(ChangeTaskHistory.created_at.desc()).all()
    return [{"id": h.id, "type": h.type, 'user_name': h.user_name, "data": h.data, "created_at": h.created_at} for h in history]
