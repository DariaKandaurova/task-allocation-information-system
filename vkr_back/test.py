import random
import string
from datetime import datetime, timedelta
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker, declarative_base
from passlib.hash import bcrypt
from passlib.hash import pbkdf2_sha256
from faker import Faker
from src.auth.models import Employee, JiraUser  # Импорт вашей модели Employee

# # Настройки подключения к базе данных
# DATABASE_URL = f"postgresql+psycopg2://timi__di:101274366@localhost:5432/Jira"  #: # Замените на ваш URL базы данных
# engine = create_engine(DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# # Инициализация Faker
# faker = Faker()

# def generate_random_password(length=12):
#     """Генерация случайного пароля"""
#     characters = string.ascii_letters + string.digits + string.punctuation
#     return ''.join(random.choice(characters) for _ in range(length))

# # def create_employee():
# #     """Генерация и добавление одного сотрудника в БД"""
# #     session = SessionLocal()
# #     try:
# #         name = faker.name()
# #         department = random.choice(["IT", "HR", "Finance", "Marketing", "Sales"])
# #         position = random.choice(["Junior", "Senior", "Middle", "TeamLead", "Product manager"])
# #         birthday = faker.date_of_birth(minimum_age=22, maximum_age=60)
# #         phone = faker.phone_number()
# #         email = faker.unique.email()
# #         password = generate_random_password()
# #         hashed_password = bcrypt.hash(password)
# #         created_at = datetime.now().astimezone()
# #         updated_at = datetime.now().astimezone()

# #         employee = Employee(
# #             name=name,
# #             department=department,
# #             position=position,
# #             birthday=birthday,
# #             phone=phone,
# #             email=email,
# #             hashed_password=hashed_password,
# #             created_at=created_at,
# #             updated_at=updated_at
# #         )
# #         session.add(employee)
# #         session.commit()
# #         print(f"Added Employee: {name} ({email}) - Password: {password}")
# #     except Exception as e:
# #         session.rollback()
# #         print(f"Error: {e}")
# #     finally:
# #         session.close()
        
# def create_employee2():
#     """Генерация и добавление одного сотрудника в БД"""
#     session = SessionLocal()
#     try:
#         name = "Назарова Анастасия Алексеевна"
#         department = "IT"
#         position = "Старший дизайнер"
#         experience = 3.6
#         birthday = '2003-02-11'
#         phone = '+7 (916) 222-44-66'
#         email = 'AANazanova@sibitnek.com'
#         password = '1'
#         hashed_password = password #bcrypt.hash(password)
#         created_at = datetime.now().astimezone()
#         updated_at = datetime.now().astimezone()
#         boss_id = 5

#         employee = Employee(
#             name=name,
#             department=department,
#             position=position,
#             experience=experience,
#             birthday=birthday,
#             phone=phone,
#             email=email,
#             hashed_password=hashed_password,
#             created_at=created_at,
#             updated_at=updated_at,
#             boss_id=boss_id
#         )
#         session.add(employee)
#         session.commit()
#         print(f"Added Employee: {name} ({email}) - Password: {password}")
#     except Exception as e:
#         session.rollback()
#         print(f"Error: {e}")
#     finally:
#         session.close()
        
    
# def test():
#     session = SessionLocal()
#     users = session.query(Employee, JiraUser).all()
#     print(users[7])
    

# # def create_multiple_employees(count=10):
# #     """Генерация нескольких сотрудников"""
# #     for _ in range(count):
# #         create_employee()

# if __name__ == "__main__":
#     create_employee2()
#     # test()

print(pbkdf2_sha256.hash("11111111"))
