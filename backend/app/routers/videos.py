from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
import os
import tempfile
import uuid
import aiofiles
import shutil
from ..database import get_db, SessionLocal
from ..models import Video
from ..ffmpeg_utils import VideoProcessor
from ..storage import storage

router = APIRouter(prefix="/api/videos", tags=["videos"])

CHUNK_SIZE = 1024 * 1024 * 8


def serialize(video: Video):
    if video.status == "completed":
        return {
            "id": video.id,
            "thumbnail_url": storage.get_public_url(video.thumbnail_key),
            "manifest_url": storage.get_public_url(video.manifest_key),
            "status": video.status,
        }
    return {
        "id": video.id,
        "thumbnail_url": None,
        "manifest_url": None,
        "status": video.status,
    }


@router.get("/")
def list_videos(db: Session = Depends(get_db)):
    return [serialize(v) for v in db.query(Video).order_by(Video.created_at.desc()).all()]


@router.get("/{video_id}")
def get_video(video_id: str, db: Session = Depends(get_db)):
    video = db.get(Video, video_id)
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    return serialize(video)


def process_video(video_id: str, input_path: str, temp_dir: str):
    db = SessionLocal()
    try:
        processor = VideoProcessor(input_path, temp_dir)
        thumbnail_path = processor.extract_thumbnail()
        master_path, hls_dir = processor.transcode_hls()

        thumbnail_key = f"videos/{video_id}/thumbnail.jpg"
        manifest_key = f"videos/{video_id}/master.m3u8"

        storage.upload_file(thumbnail_path, thumbnail_key)
        storage.upload_directory(hls_dir, f"videos/{video_id}")

        video = db.get(Video, video_id)
        video.thumbnail_key = thumbnail_key
        video.manifest_key = manifest_key
        video.status = "completed"
        db.commit()
    except Exception:
        video = db.get(Video, video_id)
        if video:
            video.status = "failed"
            db.commit()
    finally:
        db.close()
        shutil.rmtree(temp_dir, ignore_errors=True)


@router.post("/upload", status_code=202)
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.lower().endswith(".mp4"):
        raise HTTPException(status_code=400, detail="Only MP4 files are allowed")

    video_id = str(uuid.uuid4())
    temp_dir = tempfile.mkdtemp()
    input_path = os.path.join(temp_dir, f"{video_id}.mp4")

    async with aiofiles.open(input_path, "wb") as out:
        while chunk := await file.read(CHUNK_SIZE):
            await out.write(chunk)

    db_video = Video(
        id=video_id,
        thumbnail_key="",
        manifest_key="",
        status="processing",
    )
    db.add(db_video)
    db.commit()

    background_tasks.add_task(process_video, video_id, input_path, temp_dir)

    return {"id": video_id, "status": "processing"}
