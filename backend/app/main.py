
from pathlib import Path
from uuid import uuid4
import json
import shutil
import threading

from fastapi import (
    BackgroundTasks,
    FastAPI,
    File,
    HTTPException,
    UploadFile,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from backend.app.api.auth import router as auth_router
from stagesense.pipeline import analyze_video
from fastapi.responses import FileResponse


app = FastAPI(
    title="StageSense API",
    description="Multimodal AI presentation assessment system",
    version="0.1.0",
)
app.include_router(auth_router)

# Allow the Vite frontend to communicate with FastAPI.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


PROJECT_ROOT = Path(__file__).resolve().parents[2]
JOBS_DIR = PROJECT_ROOT / "storage" / "jobs"

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".webm", ".mkv"}
MAX_UPLOAD_BYTES = 500 * 1024 * 1024

# Tracks jobs currently running in this API process.
RUNNING_JOBS = set()
RUNNING_JOBS_LOCK = threading.Lock()


@app.get("/api/v1/health")
def health_check():
    return {
        "status": "ok",
        "service": "StageSense API",
    }


@app.post("/api/v1/jobs", status_code=202)
async def upload_video(file: UploadFile = File(...)):
    """Save an uploaded presentation video for analysis."""

    filename = Path(file.filename or "").name
    extension = Path(filename).suffix.lower()

    if not filename or extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Upload an MP4, MOV, WebM, or MKV video.",
        )

    JOBS_DIR.mkdir(parents=True, exist_ok=True)

    job_id = uuid4().hex
    job_dir = JOBS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=False)

    video_path = job_dir / f"source{extension}"
    total_bytes = 0

    try:
        with video_path.open("wb") as destination:
            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                total_bytes += len(chunk)

                if total_bytes > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail="Video exceeds the 500 MB upload limit.",
                    )

                destination.write(chunk)

        if total_bytes == 0:
            raise HTTPException(
                status_code=400,
                detail="The uploaded video is empty.",
            )

        return {
            "job_id": job_id,
            "status": "uploaded",
            "filename": filename,
            "size_bytes": total_bytes,
            "message": (
                "Video uploaded successfully. "
                "Analysis is not started yet."
            ),
        }

    except Exception:
        shutil.rmtree(job_dir, ignore_errors=True)
        raise

    finally:
        await file.close()


@app.get("/api/v1/jobs/{job_id}")
def get_job_status(job_id: str):
    """Return the current status of an analysis job."""

    if not job_id.isalnum():
        raise HTTPException(
            status_code=400,
            detail="Invalid job ID.",
        )

    job_dir = JOBS_DIR / job_id

    if not job_dir.is_dir():
        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    if (job_dir / "report.json").is_file():
        status = "completed"

    elif (job_dir / "error.txt").is_file():
        status = "failed"

    else:
        with RUNNING_JOBS_LOCK:
            status = (
                "processing"
                if job_id in RUNNING_JOBS
                else "uploaded"
            )

    response = {
        "job_id": job_id,
        "status": status,
    }

    if status == "failed":
        response["error"] = (
            job_dir / "error.txt"
        ).read_text(encoding="utf-8")

    return response


def run_analysis(job_id: str, video_path: Path, filename: str):
    """Run analysis and record any failure."""

    job_dir = JOBS_DIR / job_id

    try:
        analyze_video(
            video_path=video_path,
            job_dir=job_dir,
            filename=filename,
        )

        if not (job_dir / "report.json").is_file():
            raise RuntimeError(
                "Analysis finished without producing report.json."
            )

        error_path = job_dir / "error.txt"

        if error_path.exists():
            error_path.unlink()

    except Exception as exc:
        (job_dir / "error.txt").write_text(
            f"{type(exc).__name__}: {exc}",
            encoding="utf-8",
        )

    finally:
        with RUNNING_JOBS_LOCK:
            RUNNING_JOBS.discard(job_id)


@app.post("/api/v1/jobs/{job_id}/analyze", status_code=202)
def start_analysis(
    job_id: str,
    background_tasks: BackgroundTasks,
):
    """Queue analysis for an uploaded video."""

    if not job_id.isalnum():
        raise HTTPException(
            status_code=400,
            detail="Invalid job ID.",
        )

    job_dir = JOBS_DIR / job_id

    if not job_dir.is_dir():
        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    video_files = [
        path
        for path in job_dir.iterdir()
        if (
            path.is_file()
            and path.stem == "source"
            and path.suffix.lower() in ALLOWED_EXTENSIONS
        )
    ]

    if not video_files:
        raise HTTPException(
            status_code=404,
            detail="Uploaded video not found for this job.",
        )

    if (job_dir / "report.json").is_file():
        return {
            "job_id": job_id,
            "status": "completed",
        }

    if (job_dir / "error.txt").is_file():
        (job_dir / "error.txt").unlink()

    with RUNNING_JOBS_LOCK:
        if job_id in RUNNING_JOBS:
            return {
                "job_id": job_id,
                "status": "processing",
                "message": "Analysis is already running.",
            }

        RUNNING_JOBS.add(job_id)

    try:
        background_tasks.add_task(
            run_analysis,
            job_id,
            video_files[0],
            video_files[0].name,
        )

    except Exception:
        with RUNNING_JOBS_LOCK:
            RUNNING_JOBS.discard(job_id)
        raise

    return {
        "job_id": job_id,
        "status": "processing",
        "message": "Analysis has been queued.",
    }


@app.get("/api/v1/jobs/{job_id}/report")
def get_job_report(job_id: str):
    """Return the completed assessment report."""

    if not job_id.isalnum():
        raise HTTPException(
            status_code=400,
            detail="Invalid job ID.",
        )

    job_dir = JOBS_DIR / job_id

    if not job_dir.is_dir():
        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    report_path = job_dir / "report.json"

    if not report_path.is_file():
        error_path = job_dir / "error.txt"

        if error_path.is_file():
            raise HTTPException(
                status_code=500,
                detail={
                    "message": "Analysis failed.",
                    "error": error_path.read_text(
                        encoding="utf-8"
                    ),
                },
            )

        raise HTTPException(
            status_code=409,
            detail=(
                "Report is not ready yet. "
                "Check the job status."
            ),
        )

    try:
        with report_path.open(
            "r",
            encoding="utf-8",
        ) as report_file:
            return json.load(report_file)

    except (json.JSONDecodeError, OSError) as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not read the assessment report: {exc}",
        )

@app.get("/api/v1/jobs/{job_id}/video")
def get_job_video(job_id: str):
    """Serve the original uploaded video for replay."""

    if not job_id.isalnum():
        raise HTTPException(
            status_code=400,
            detail="Invalid job ID.",
        )

    job_dir = JOBS_DIR / job_id

    if not job_dir.is_dir():
        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    video_files = [
        path
        for path in job_dir.iterdir()
        if (
            path.is_file()
            and path.stem == "source"
            and path.suffix.lower() in ALLOWED_EXTENSIONS
        )
    ]

    if not video_files:
        raise HTTPException(
            status_code=404,
            detail="Uploaded video not found for this job.",
        )

    video_path = video_files[0]

    media_types = {
        ".mp4": "video/mp4",
        ".mov": "video/quicktime",
        ".webm": "video/webm",
        ".mkv": "video/x-matroska",
    }

    return FileResponse(
        path=video_path,
        media_type=media_types.get(
            video_path.suffix.lower(),
            "application/octet-stream",
        ),
        filename=video_path.name,
    )
