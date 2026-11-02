
import json
from pathlib import Path

from stagesense.scoring.speaking_rate import score_speaking_rate
from stagesense.scoring.vocal_expressiveness import (
    score_vocal_expressiveness,
)
from stagesense.scoring.posture_score import score_posture
from stagesense.scoring.gesture_score import score_gesture_activity


def score_feature_windows(
    combined_features_path: str | Path,
    output_path: str | Path,
) -> dict:
    """Score available acoustic and visual features per time window."""
    source = Path(combined_features_path)
    if not source.is_file():
        raise FileNotFoundError(f"Features not found: {source}")

    data = json.loads(source.read_text(encoding="utf-8"))
    windows = data.get("windows", [])
    scored_windows = []

    for window in windows:
        audio = window.get("audio") or {}
        visual = window.get("visual") or {}
        posture = visual.get("posture") or {}
        gestures = visual.get("gesture_movement") or {}

        pitch_std = audio.get("pitch_std_hz")
        intensity_mean = audio.get("intensity_mean_db")

        scores = {
            "speaking_rate": {
                "score": None,
                "status": "unavailable",
                "feedback": (
                    "Speaking rate is calculated from the full transcript, "
                    "not this audio window."
                ),
            },
            "vocal_expressiveness": score_vocal_expressiveness(
                pitch_std, intensity_mean
            ),
            "posture": score_posture(
                posture.get("mean_torso_lean_deg")
            ),
            "gestures": score_gesture_activity(
                gestures.get("mean_wrist_displacement")
            ),
        }

        scored_windows.append({
            "t0": window["t0"],
            "t1": window["t1"],
            "scores": scores,
        })

    result = {
        "window_count": len(scored_windows),
        "windows": scored_windows,
        "note": (
            "Window scores are preliminary heuristics. Speaking rate "
            "and fluency require transcript-level analysis."
        ),
    }

    destination = Path(output_path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(
        json.dumps(result, indent=2),
        encoding="utf-8",
    )
    return result
