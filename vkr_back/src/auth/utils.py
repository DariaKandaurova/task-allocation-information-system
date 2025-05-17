from src.auth.models import JiraUser, Employee
from src.task.models import TaskAsignee, Task
from src.auth.schemas import LoginUser, NewJiraUser, JiraUserResponse
from passlib.hash import pbkdf2_sha256
from src.constants import compare_position_to_nums, compare_difficulty_to_rating
from sqlalchemy import or_

def add_jira_user(user: NewJiraUser, db_session):
    employee: Employee = db_session.query(Employee).filter(Employee.email == user.email).first()
    if employee:
        experirnce_norm = min(employee.experience / 10, 1)
        position_norm = (compare_position_to_nums[employee.position.lower().split()[0]] - 1) / 4
    new_user = JiraUser(
        employee_id = employee.id if employee else None,
        username = user.email.split('@')[0],
        email = user.email,
        hashed_password = employee.hashed_password if employee else pbkdf2_sha256.hash(user.password),
        role = user.role,
        rating = 1 + 9 * (0.2 * experirnce_norm + 0.35 * position_norm) if employee else None
    )
    
    db_session.add(new_user)
    db_session.flush()
    db_session.commit()
    return new_user.id
    
    
def delete_jira_user(user_id: str, db_session):
    db_session.query(JiraUser).filter(JiraUser.id == user_id).delete()
    db_session.commit()
    
    
def update_jira_user_role(user_id: str, role: str, db_session):
    db_session.query(JiraUser).filter(JiraUser.id == user_id).update({"role": role})
    db_session.commit()


def update_jira_user_status(db_session, status: str, user_id: str | None = None, user_email: str | None = None):
    if user_id:
        db_session.query(JiraUser).filter(JiraUser.id == user_id).update({"status": status})
    elif user_email:
        db_session.query(JiraUser).filter(JiraUser.email == user_email).update({"status": status})
    db_session.commit()
    

def get_jira_user(user_id: str, db_session) -> JiraUser:
    return db_session.query(JiraUser).filter(JiraUser.id == user_id).first()

def get_all_employees(db_session):
    return db_session.query(Employee).all()

    
def check_credentials(user: LoginUser, db_session) -> bool:
    jira_user: JiraUser = db_session.query(JiraUser).filter(JiraUser.email == user.email).first()
    
    if not jira_user:
        return False
    
    return pbkdf2_sha256.verify(user.password, jira_user.hashed_password) # user.password == jira_user.hashed_password


def get_all_users(db_session, user_id: int = None, mybabies: bool = False, difficulty: int = None):
    if user_id and mybabies:
        boss_id = db_session.query(Employee).join(JiraUser, Employee.id == JiraUser.employee_id).filter(JiraUser.id == user_id).first().id
        db_users = db_session.query(JiraUser, Employee).join(Employee, JiraUser.employee_id == Employee.id, isouter=True).filter(Employee.boss_id == boss_id).all()
        users_list = []
        user_data = {}
        for user in db_users:
            user_data.update(user[0].__dict__)
            user_data['name'] = user[1].name
            user_data['department'] = user[1].department
            user_data['position'] = user[1].position
            user_data['experience'] = user[1].experience
            user_data['phone'] = user[1].phone
            user_data['email'] = user[0].email
            user_data.pop('rating')
            users_list.append(user_data)
            user_data = {}
        if difficulty:
            user_filtered_list = []
            print(db_users)
            users_filtered = filter(lambda x: compare_difficulty_to_rating[difficulty]['min'] <= x[0].rating <= compare_difficulty_to_rating[difficulty]['max'] if x[0].rating else False, db_users)
            for user in users_filtered:
                if user[0].role == 'Тимлид':
                    user_tasks = db_session.query(TaskAsignee) \
                    .join(Task, Task.id == TaskAsignee.task_id) \
                    .filter(TaskAsignee.requestor_id == user[0].id) \
                    .filter(or_(Task.status == 'В работе', Task.status == 'Ожидающие', Task.status == 'Новые')) \
                    .count()
                else:   
                    user_tasks = db_session.query(TaskAsignee) \
                    .join(Task, Task.id == TaskAsignee.task_id) \
                    .filter(TaskAsignee.executor_id == user[0].id) \
                    .filter(or_(Task.status == 'В работе', Task.status == 'Ожидающие', Task.status == 'Новые')) \
                    .count()
                
                user_filtered_list.append({
                    'id': user[0].id,
                    'name': user[1].name,
                    'rating': round(user[0].rating, 3)
                    if user[0].rating else None,
                    'tasks': -user_tasks,
                    'department': user[1].department,
                    'position': user[1].position,
                    'email': user[0].email,
                    'experience': user[1].experience,
                    'phone': user[1].phone
                })
            user_filtered_list.sort(key=lambda x: x['tasks'], reverse=True)
            filtered_ids = [user['id'] for user in user_filtered_list]
            all_users_list = filter(lambda x: x['id'] not in filtered_ids, users_list)
            return {'filtered_users': user_filtered_list, 'all_users': [JiraUserResponse(**user) for user in all_users_list]}
        else:
            return {'all_users': [JiraUserResponse(**user) for user in users_list]}
            
    elif user_id:
        users = db_session.query(JiraUser, Employee).join(Employee, JiraUser.employee_id == Employee.id).filter(JiraUser.id == user_id).first()
        if users:
            user_data = users[0].__dict__
            user_data['name'] = users[1].name
            user_data['department'] = users[1].department
            user_data['position'] = users[1].position
            user_data['experience'] = users[1].experience
            user_data['rating'] = users[1].rating
            user_data['birthday'] = users[1].birthday
            user_data['phone'] = users[1].phone
            return [user_data]
        users = db_session.query(JiraUser).filter(JiraUser.id == user_id).first()
        if users:
            return [users.__dict__]
    else:
        users = db_session.query(JiraUser, Employee).join(Employee, JiraUser.employee_id == Employee.id, isouter=True).all()
        
    users_list = []
    for user in users:
        user_data = user[0].__dict__
        user_data['name'] = user[1].name if user[1] else ''
        user_data['department'] = user[1].department if user[1] else ''
        user_data['position'] = user[1].position if user[1] else ''
        user_data['experience'] = user[1].experience if user[1] else 0
        user_data['rating'] = user[1].rating if user[1] else 0
        user_data['birthday'] = user[1].birthday if user[1] else ''
        user_data['phone'] = user[1].phone if user[1] else ''
        users_list.append(user_data)
    return users_list


def get_user_by_email(email: str, db_session) -> JiraUser:
    return db_session.query(JiraUser).filter(JiraUser.email == email).first()


def get_employee_id_by_user_id(user_id: int, db_session) -> int:
    return db_session.query(Employee).join(JiraUser, Employee.id == JiraUser.employee_id).filter(JiraUser.id == user_id).first().id
