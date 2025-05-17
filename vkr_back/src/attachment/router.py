from fastapi import APIRouter, Path, File, UploadFile
from fastapi.responses import FileResponse
from src.attachment.utils import get_attachment_by_id, add_attachment_to_task, delete_attachment_by_id
from src.database import get_db_session


router = APIRouter(
    tags=["attachments"],
    prefix="/attachment"
)

@router.get("/{attachment_id}")
def get_attachment(attachment_id: int = Path(...)):
    with get_db_session() as session:
        attachment = get_attachment_by_id(attachment_id, session)
        return FileResponse(attachment.file_path, media_type='application/octet-stream', filename=attachment.file_name)
    
    
@router.post("/task/{task_id}")
def add_attachment(task_id: int = Path(...), attachment: UploadFile = File(...)):
    with get_db_session() as session:
        add_attachment_to_task(task_id, attachment, session)
        return {"message": "Attachment added successfully"}
    
    
@router.delete("/{attachment_id}")
def delete_attachment(attachment_id: int = Path(...)):
    with get_db_session() as session:
        delete_attachment_by_id(attachment_id, session)
        return {"message": "Attachment deleted successfully"}

