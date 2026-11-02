
from fractions import Fraction
from pathlib import Path
import json
import subprocess

import cv2


class VideoFrameError(Exception):
    """Raised when video frames cannot be read."""


def _get_source_fps(video_path: Path) -> float:
    """Read the nominal frame rate using FFprobe."""
    command = [
        "ffprobe",
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=r_frame_rate",
        "-of", "json",
        str(video_path),
    ]

    try:
        result = subprocess.run(
            command,
            capture_output=True,
            text=True,
            check=True,
        )
        streams = json.loads(result.stdout).get("streams", [])
        if not streams:
            raise VideoFrameError("No video stream found.")

        fps = float(Fraction(streams[0]["r_frame_rate"]))
        if fps <= 0:
            raise VideoFrameError("Invalid source frame rate.")

        return fps

    except (subprocess.SubprocessError, ValueError, ZeroDivisionError) as exc:
        raise VideoFrameError(
            f"Could not determine source frame rate: {exc}"
        ) from exc


def sample_video_frames(
    video_path: str | Path,
    fps: float = 10.0,
    max_frames: int | None = None,
):
    """Yield sampled video frames with their timestamps."""
    path = Path(video_path)

    if not path.is_file():
        raise FileNotFoundError(f"Video not found: {path}")
    if fps <= 0:
        raise ValueError("FPS must be positive.")
    if max_frames is not None and max_frames < 1:
        return

    source_fps = _get_source_fps(path)
    frame_interval = max(1, round(source_fps / fps))

    capture = cv2.VideoCapture(str(path))
    if not capture.isOpened():
        raise VideoFrameError(f"Could not open video: {path}")

    frame_index = 0
    yielded = 0

    try:
        while True:
            success, frame = capture.read()
            if not success:
                break

            if frame_index % frame_interval == 0:
                timestamp = frame_index / source_fps
                yield timestamp, frame
                yielded += 1

                if max_frames is not None and yielded >= max_frames:
                    break

            frame_index += 1
    finally:
        capture.release()
