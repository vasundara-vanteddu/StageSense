
import json
from pathlib import Path


def combine_features(
    audio_windows_path: str | Path,
    visual_features_path: str | Path,
    output_path: str | Path,
) -> dict:
    """Combine acoustic windows with timestamped visual features."""
    audio_path = Path(audio_windows_path)
    visual_path = Path(visual_features_path)

    audio_windows = json.loads(
        audio_path.read_text(encoding="utf-8")
    )
    visual_data = json.loads(
        visual_path.read_text(encoding="utf-8")
    )

    if not isinstance(audio_windows, list):
        raise ValueError("Audio features must be a JSON list.")

    posture_frames = visual_data.get("posture", [])
    gesture_frames = visual_data.get("gesture_movement", [])

    combined = []

    for audio in audio_windows:
        start = float(audio["t0"])
        end = float(audio["t1"])

        valid_posture = [
            frame for frame in posture_frames
            if frame.get("available")
            and start <= float(frame["timestamp"]) < end
        ]

        valid_gestures = [
            frame for frame in gesture_frames
            if frame.get("available")
            and start < float(frame["timestamp"]) <= end
        ]

        posture_summary = None
        if valid_posture:
            posture_summary = {
                "mean_torso_lean_deg": round(
                    sum(f["torso_lean_deg"] for f in valid_posture)
                    / len(valid_posture), 2
                ),
                "mean_shoulder_alignment_deg": round(
                    sum(
                        f["shoulder_alignment_deg"]
                        for f in valid_posture
                    ) / len(valid_posture), 2
                ),
                "valid_frame_count": len(valid_posture),
            }

        gesture_summary = None
        if valid_gestures:
            gesture_summary = {
                "mean_wrist_displacement": round(
                    sum(
                        f["mean_wrist_displacement"]
                        for f in valid_gestures
                    ) / len(valid_gestures), 4
                ),
                "valid_pair_count": len(valid_gestures),
            }

        combined.append({
            "t0": start,
            "t1": end,
            "audio": audio,
            "visual": {
                "posture": posture_summary,
                "gesture_movement": gesture_summary,
            },
        })

    result = {
        "audio_window_count": len(audio_windows),
        "combined_window_count": len(combined),
        "windows": combined,
    }

    destination = Path(output_path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(
        json.dumps(result, indent=2),
        encoding="utf-8",
    )

    return result
