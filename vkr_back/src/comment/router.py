from fastapi import APIRouter, status, Path, File, Form, UploadFile
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from src.comment.schemas import NewComment, CommentResponse
from fastapi import Body
from src.comment.utils import create_comment, get_comments_by_task_id, update_comment_by_id, delete_comment_by_id
from src.attachment.utils import add_attachment_to_comment
from src.database import get_db_session
from typing import List
router = APIRouter(
    prefix="/comment",
    tags=["comment"]
)


@router.post("")
async def add_comment(comment = Form(...), attachments: List[UploadFile] | None = File(None)):
    try:
        comment = NewComment.model_validate_json(comment)
    except ValidationError as e:
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content={"message": str(e)})
    with get_db_session() as db_session:
        comment_id = create_comment(comment, db_session)
        print(attachments)
        if attachments:
            for attachment in attachments:
                await add_attachment_to_comment(comment_id, attachment, comment.current_user, db_session)
        return JSONResponse(status_code=status.HTTP_201_CREATED, content={"message": "Comment created successfully"})
    

@router.get("/{task_id}")
def get_comments_by_task(task_id: int = Path(...)) -> List[CommentResponse]:
    with get_db_session() as db_session:
        return get_comments_by_task_id(task_id, db_session)
    

@router.patch("/{comment_id}")
def update_comment_text_by_id(comment_id: int = Path(...), text: str = Body(embed=True)):
    with get_db_session() as db_session:
        update_comment_by_id(comment_id, text, db_session)
        return JSONResponse(status_code=status.HTTP_200_OK, content={"message": "Comment updated successfully"})
    

@router.delete("/{comment_id}")
def delete_comment(comment_id: int = Path(...)):
    with get_db_session() as db_session:
        delete_comment_by_id(comment_id, db_session)
        return JSONResponse(status_code=status.HTTP_204_NO_CONTENT, content={"message": "Comment deleted successfully"})
