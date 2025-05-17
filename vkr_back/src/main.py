from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routers import router
from src.database import get_db_session
from src.auth.models import Employee
from src.task.models import Task, TaskAsignee
import asyncio
from datetime import datetime
from contextlib import asynccontextmanager

async def update_rating():
    await asyncio.sleep(30 * 24 * 60 * 60)
    while True:
        with get_db_session() as db_session:
            employees = db_session.query(Employee).all()
            for employee in employees:
                employee.experience += round(1/12, 3)
                db_session.commit()
        await asyncio.sleep(30 * 24 * 60 * 60)
        
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting lifespan")
    task = asyncio.create_task(update_rating())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        print("Lifespan cancelled")
        
app = FastAPI(
	title="API",
	lifespan=lifespan
)

app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost:3000"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
	import uvicorn

	uvicorn.run(app, host="0.0.0.0", port=8000)
