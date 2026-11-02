
import json
import subprocess
from pathlib import Path

SUPPORTED_EXTENSIONS = {".mp4", ".mov", ".webm", ".mkv"}
MIN_DURATION_SECONDS = 60
MAX_DURATION_SECONDS = 15 * 60


class VideoValidationError(Exception):
    """Raised when an uploaded video cannot be analyzed."""


def probe_video(file_path: str | Path) -> dict:
    """Read video metadata using FFprobe and validate its streams."""
    path = Path(file_path)

    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise VideoValidationError("UNSUPPORTED_FORMAT")

    if not path.is_file():
        raise VideoValidationError("FILE_NOT_FOUND")

    result = subprocess.run(
        [
            "ffprobe",
            "-v", "error",
            "-show_entries",
            "format=duration:stream=codec_type",
            "-of", "json",
            str(path),
        ],
        capture_output=True,
        text=True,
        timeout=30,
        check=False,
    )

    if result.returncode != 0:
        raise VideoValidationError("INVALID_VIDEO")

    try:
        metadata = json.loads(result.stdout)
        duration = float(metadata["format"]["duration"])
        streams = metadata.get("streams", [])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError) as exc:
        raise VideoValidationError("INVALID_VIDEO") from exc

    stream_types = {stream.get("codec_type") for stream in streams}

    if "video" not in stream_types:
        raise VideoValidationError("NO_VIDEO_STREAM")

    if "audio" not in stream_types:
        raise VideoValidationError("NO_AUDIO_STREAM")

    if duration < MIN_DURATION_SECONDS:
        raise VideoValidationError("TOO_SHORT")

    if duration > MAX_DURATION_SECONDS:
        raise VideoValidationError("TOO_LONG")

    return {
        "path": str(path.resolve()),
        "duration_s": duration,
        "has_audio": True,
        "has_video": True,
    }
