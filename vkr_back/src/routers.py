from src.comment.router import router as comment_router
from src.project.router import router as jira_router
from src.auth.router import router as auth_router
from src.task.router import router as task_router
from src.attachment.router import router as attachment_router
from src.stats.router import router as stats_router

from fastapi import APIRouter



router = APIRouter()

router.include_router(comment_router)
router.include_router(jira_router)
router.include_router(auth_router)
router.include_router(task_router)
router.include_router(attachment_router)
router.include_router(stats_router)