from datetime import datetime
from sqlalchemy import func, alias, or_
from src.task.models import Task, TaskAsignee
from src.auth.models import JiraUser, Employee
from sqlalchemy.orm import Session
from src.auth.utils import get_employee_id_by_user_id
from math import floor


def hist_plot_by_difficulty(project_id: int | None, user_id: int, period_start: datetime, period_end: datetime, session: Session):
    print(project_id, user_id, period_start, period_end)
    
    if project_id:
        query = session.query(Task.difficulty, func.count(Task.difficulty)).join(TaskAsignee, Task.id == TaskAsignee.task_id).filter(TaskAsignee.executor_id == user_id).filter(Task.project_id == project_id).filter(Task.difficulty.isnot(None)).filter(Task.update_done_time >= period_start).filter(Task.update_done_time <= period_end).group_by(Task.difficulty)
    else:
        query = session.query(Task.difficulty, alias(func.count(Task.difficulty), 'count')).join(TaskAsignee, Task.id == TaskAsignee.task_id).filter(TaskAsignee.executor_id == user_id).filter(Task.difficulty.isnot(None)).filter(Task.update_done_time >= period_start).filter(Task.update_done_time <= period_end).group_by(Task.difficulty)
    res = query.all()
    print(res)
    return {row[0]: row[1] for row in res}


def average_task_time(project_id: int | None, user_id: int, period_start: datetime, period_end: datetime, session: Session):
    pass


from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
# Предполагается, что модели Task, TaskAsignee, Employee импортированы

# -------------------------------
# 1. Функции для получения набора задач по фильтрам
# -------------------------------

def get_employee_tasks(session: Session, user_id: int, start_date: datetime, end_date: datetime):
    """
    Возвращает список задач, назначенных на сотрудника (через TaskAsignee),
    созданных в заданный период.
    """
    tasks = session.query(Task).join(TaskAsignee).filter(
        TaskAsignee.executor_id == user_id,
        Task.updated_at.between(start_date, end_date)
    ).all()
    
    print(len(tasks))
    
    return tasks


def get_team_tasks(session: Session, user_id: int, start_date: datetime, end_date: datetime):
    """
    Для заданного boss_id выбирает всех сотрудников (команду), затем возвращает
    задачи, назначенные этим сотрудникам, созданные в заданный период.
    """
    boss_id = get_employee_id_by_user_id(user_id, session)
    
    team_members = session.query(JiraUser).join(Employee).filter(Employee.boss_id == boss_id).all()
    team_member_ids = [emp.id for emp in team_members]
    
    print(team_member_ids)
    tasks = session.query(Task).join(TaskAsignee).filter(
        TaskAsignee.executor_id.in_(team_member_ids),
        Task.updated_at.between(start_date, end_date)
    ).all()
    
    print(len(tasks))
    
    return tasks


def get_project_tasks(session: Session, project_id: int, start_date: datetime, end_date: datetime):
    """
    Возвращает список задач для указанного проекта, созданных в заданный период.
    """
    print(start_date, end_date)
    return session.query(Task).filter(
        Task.project_id == project_id,
        Task.updated_at.between(start_date, end_date)
    ).all()


# -------------------------------
# 2. Функции для расчёта метрик
# -------------------------------

def calculate_average_status_durations(tasks: list):
    """
    Для списка задач рассчитывает среднее время (в секундах), проведённое в каждом статусе:
      - "Новые": от created_at до update_wait_time
      - "Ожидающе": от update_wait_time до update_in_progress_time
      - "В работе": от update_in_progress_time до update_done_time
    Если нужная временная метка отсутствует – задача не участвует в расчёте данного показателя.
    """
    new_durations = []
    waiting_durations = []
    in_progress_durations = []
    
    for task in tasks:
        if task.update_wait_time:
            new_durations.append((task.update_wait_time - task.created_at).total_seconds())
        if task.update_wait_time and task.update_in_progress_time:
            waiting_durations.append((task.update_in_progress_time - task.update_wait_time).total_seconds())
        if task.update_in_progress_time and task.update_done_time:
            in_progress_durations.append((task.update_done_time - task.update_in_progress_time).total_seconds())
    
    return {
        "Новые": floor(sum(new_durations)/len(new_durations)) if new_durations else 0,
        "Ожидающие": floor(sum(waiting_durations)/len(waiting_durations)) if waiting_durations else 0,
        "В работе": floor(sum(in_progress_durations)/len(in_progress_durations)) if in_progress_durations else 0
    }


def count_status_transitions(tasks: list, period_start: datetime, period_end: datetime):
    """
    Считает количество:
      - Задач, появившихся в статусе "Новые" (created_at в период)
      - Задач, перешедших в статус "В работе" (имеют update_in_progress_time в период)
      - Задач, завершённых ("Выполнена": update_done_time в период)
    """
    new_count = sum(1 for task in tasks if period_start <= task.created_at <= period_end)
    waiting_count = sum(1 for task in tasks if task.update_wait_time and period_start <= task.update_wait_time <= period_end)
    in_progress_count = sum(1 for task in tasks if task.update_in_progress_time and period_start <= task.update_in_progress_time <= period_end)
    completed_count = sum(1 for task in tasks if task.update_done_time and period_start <= task.update_done_time <= period_end)
    
    return {
        "Новые": new_count,
        "Ожидающие": waiting_count,
        "В работе": in_progress_count,
        "Выполнена": completed_count
    }


def average_completion_time(tasks: list):
    """
    Рассчитывает среднее время выполнения задач (в секундах) по разнице между created_at и update_done_time.
    Учитываются только завершённые задачи (где update_done_time определён).
    """
    durations = [
        (task.update_done_time - task.created_at).total_seconds()
        for task in tasks if task.update_done_time
    ]
    return sum(durations)/len(durations) if durations else 0


def average_completion_time_by_difficulty(tasks: list):
    """
    Группирует задачи по сложности (difficulty) и рассчитывает среднее время выполнения
    (в секундах) для каждой группы.
    """
    durations_by_diff = {}
    for task in tasks:
        if task.update_done_time and task.difficulty is not None:
            duration = (task.update_done_time - task.update_in_progress_time).total_seconds()
            durations_by_diff.setdefault(task.difficulty, []).append(duration)
    
    # Вычисляем среднее для каждой сложности
    return {diff: sum(durations)/len(durations) for diff, durations in durations_by_diff.items()}


def percentage_completed_on_time(tasks: list):
    """
    Рассчитывает процент завершённых задач, выполненных вовремя, то есть тех, у которых
    update_done_time <= due_date.
    """
    completed_tasks = []
    for task in tasks:
        if task.update_done_time:
            completed_tasks.append(task)
        elif datetime.now().astimezone() > task.due_date:
            completed_tasks.append(task)
        # elif task.update_in_progress_time and task.update_in_progress_time > task.due_date:
        #     completed_tasks.append(task)
        # elif task.created_at and task.created_at > task.due_date:
        #     completed_tasks.append(task)
    if not completed_tasks:
        return 0
    on_time_tasks = [task for task in completed_tasks if task.update_done_time and task.update_done_time <= task.due_date]
    return (len(on_time_tasks) / len(completed_tasks)) * 100


def count_active_tasks(tasks: list):
    """
    Подсчитывает количество активных задач. Активными считаются задачи, которые не завершены,
    т.е. у которых отсутствует update_done_time (или их статус не равен "Выполнена", если это отражается в данных).
    """
    active_tasks = [task for task in tasks if not task.update_done_time]
    return len(active_tasks)


def get_teamlead_users(user_id: int, session: Session):
    boss_id = get_employee_id_by_user_id(user_id, session)
    return sorted(session.query(JiraUser.id, Employee.name).join(Employee, JiraUser.employee_id == Employee.id, isouter=True).filter(Employee.boss_id == boss_id).all(), key=lambda x: x[1])


def get_amount_of_done_tasks_by_user_id_and_period(user_id: int, period_start: datetime, period_end: datetime, session: Session, project_id: int | None = None):
    if project_id:
        amount = session.query(Task.id).join(TaskAsignee).filter(
            TaskAsignee.executor_id == user_id,
            Task.project_id == project_id,
            Task.update_done_time.between(period_start, period_end)
        ).count()
    else:
        amount = session.query(Task.id).join(TaskAsignee).filter(
            TaskAsignee.executor_id == user_id,
            Task.update_done_time.between(period_start, period_end)
    ).count()
    return amount


def get_avg_difficulty_by_user_id_and_period(user_id: int, period_start: datetime, period_end: datetime, session: Session, project_id: int | None = None):
    if project_id:
        tasks = session.query(Task.difficulty).join(TaskAsignee).filter(
            TaskAsignee.executor_id == user_id,
            Task.project_id == project_id,
            Task.update_done_time.between(period_start, period_end)
        )
    else:
        tasks = session.query(Task.difficulty).join(TaskAsignee).filter(
            TaskAsignee.executor_id == user_id,
            Task.update_done_time.between(period_start, period_end)
    )
    sum = 0
    for task in tasks:
        sum += task.difficulty
        
    return sum
    


def get_id_name_by_user_id(user_id: int, session: Session):
    return session.query(JiraUser.id, Employee.name).join(Employee, JiraUser.employee_id == Employee.id, isouter=True).filter(JiraUser.id == user_id).first()

