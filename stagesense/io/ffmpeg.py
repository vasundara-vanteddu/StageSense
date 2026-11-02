
import subprocess
from pathlib import Path


class AudioExtractionError(Exception):
    """Raised when audio extraction fails."""


def extract_audio(
    video_path: str | Path,
    output_path: str | Path,
) -> Path:
    """Extract 16 kHz mono PCM audio from a video using FFmpeg."""
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
            "-vn",
            "-ac", "1",
            "-ar", "16000",
            "-c:a", "pcm_s16le",
            str(destination),
        ],
        capture_output=True,
        text=True,
        timeout=300,
        check=False,
    )

    if result.returncode != 0 or not destination.is_file():
        raise AudioExtractionError(
            result.stderr[-2000:] or "Audio extraction failed."
        )

    return destination
