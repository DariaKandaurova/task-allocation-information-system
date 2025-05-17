from src.project.models import Project, ProjectAsignee
from sqlalchemy.orm import Session
from src.project.schemas import NewProject
    
    
def create_new_project(new_project: NewProject, db_session):
    project = Project(
        name = new_project.name,
        description = new_project.description,
    )
    
    db_session.add(project)
    db_session.flush()
    
    project_asignee = ProjectAsignee(
        project_id = project.id,
        user_id = new_project.user_id
    )
    
    db_session.add(project_asignee)
    
    db_session.commit()
    
    
def add_user_to_project(project_id: str, user_id: str, db_session: Session):
    project_asignee = ProjectAsignee(
        project_id = project_id,
        user_id = user_id
    )
    db_session.add(project_asignee)
    db_session.commit()
    

def get_projects(db_session: Session):
    projects = db_session.query(Project).all()
    return projects
    


def get_projects_by_user_id(user_id: str, db_session: Session):
    projects = db_session.query(Project).join(ProjectAsignee, ProjectAsignee.project_id == Project.id).filter(ProjectAsignee.user_id == user_id).all()
    
    return projects
    
    