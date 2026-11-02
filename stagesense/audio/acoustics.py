
from pathlib import Path

import numpy as np
import parselmouth


class AcousticFeatureError(Exception):
    """Raised when acoustic features cannot be extracted."""


def extract_acoustic_features(
    audio_path: str | Path,
    window_seconds: float = 10.0,
    hop_seconds: float = 5.0,
) -> list[dict]:
    """Extract pitch and intensity statistics in overlapping time windows."""
    path = Path(audio_path)

    if not path.is_file():
        raise FileNotFoundError(f"Audio not found: {path}")

    if window_seconds <= 0 or hop_seconds <= 0:
        raise ValueError("Window and hop durations must be positive.")

    sound = parselmouth.Sound(str(path))
    duration = sound.get_total_duration()

    if duration <= 0:
        raise AcousticFeatureError("Audio is empty.")

    pitch = sound.to_pitch(
        time_step=0.01,
        pitch_floor=75,
        pitch_ceiling=500,
    )
    pitch_values = pitch.selected_array["frequency"]

    intensity = sound.to_intensity(
        time_step=0.01,
        minimum_pitch=75,
    )
    intensity_values = intensity.values[0]

    pitch_times = pitch.xs()
    intensity_times = intensity.xs()

    windows = []
    start = 0.0

    while start < duration:
        end = min(start + window_seconds, duration)

        pitch_mask = (
            (pitch_times >= start)
            & (pitch_times < end)
            & (pitch_values > 0)
        )
        intensity_mask = (
            (intensity_times >= start)
            & (intensity_times < end)
            & np.isfinite(intensity_values)
            & (intensity_values > 0)
        )

        valid_pitch = pitch_values[pitch_mask]
        valid_intensity = intensity_values[intensity_mask]

        windows.append({
            "t0": round(start, 3),
            "t1": round(end, 3),
            "pitch_median_hz": (
                round(float(np.median(valid_pitch)), 2)
                if valid_pitch.size else None
            ),
            "pitch_std_hz": (
                round(float(np.std(valid_pitch)), 2)
                if valid_pitch.size else None
            ),
            "intensity_mean_db": (
                round(float(np.mean(valid_intensity)), 2)
                if valid_intensity.size else None
            ),
        })

        start += hop_seconds

    return windows
