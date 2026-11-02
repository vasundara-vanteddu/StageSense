
import subprocess
from pathlib import Path


class PlaybackPreparationError(Exception):
    """Raised when playback video preparation fails."""


def prepare_playback(
    video_path: str | Path,
    output_path: str | Path,
) -> Path:
    """Transcode a source video to browser-friendly H.264 MP4."""
    source = Path(video_path)
    destination = Path(output_path)

    if not source.is_file():
        raise FileNotFoundError(f"Video not found: {source}")

    destination.parent.mkdir(parents=True, exist_ok=True)

    result = subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-i", str(source),
            "-vf", "scale=-2:720:force_original_aspect_ratio=decrease",
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "26",
            "-c:a", "aac",
            "-movflags", "+faststart",
            str(destination),
        ],
        capture_output=True,
        text=True,
        timeout=600,
        check=False,
    )

    if result.returncode != 0 or not destination.is_file():
        raise PlaybackPreparationError(
            result.stderr[-2000:] or "Playback preparation failed."
        )

    return destination
