
import json
from pathlib import Path

from stagesense.visual.pose import analyze_pose
from stagesense.visual.posture import extract_posture_features
from stagesense.visual.gestures import analyze_gesture_movement


def save_visual_features(
    video_path: str,
    output_path: str,
    fps: float = 1.0,
) -> dict:
    """Extract and save posture and wrist-movement features."""
    poses = analyze_pose(video_path, fps=fps)

    posture = [
        extract_posture_features(pose)
        for pose in poses
    ]

    gestures = [
        analyze_gesture_movement(previous, current)
        for previous, current in zip(poses, poses[1:])
    ]

    result = {
        "video_path": str(video_path),
        "sampling_fps": fps,
        "frames_analyzed": len(poses),
        "detected_frames": sum(
            pose["detected"] for pose in poses
        ),
        "posture": posture,
        "gesture_movement": gestures,
    }

    destination = Path(output_path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(
        json.dumps(result, indent=2),
        encoding="utf-8",
    )

    return result
