
import math


def _distance(a: dict, b: dict) -> float:
    """Calculate 2D distance between two normalized landmarks."""
    return math.hypot(a["x"] - b["x"], a["y"] - b["y"])


def extract_posture_features(
    pose_result: dict,
) -> dict:
    """Extract basic posture features from one pose result."""
    landmarks = pose_result.get("landmarks", [])

    if not pose_result.get("detected") or len(landmarks) < 25:
        return {
            "timestamp": pose_result.get("timestamp"),
            "available": False,
            "reason": "Pose not detected",
        }

    # MediaPipe Pose landmark indices.
    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]
    left_hip = landmarks[23]
    right_hip = landmarks[24]

    shoulder_width = _distance(left_shoulder, right_shoulder)
    hip_center_x = (left_hip["x"] + right_hip["x"]) / 2
    hip_center_y = (left_hip["y"] + right_hip["y"]) / 2
    shoulder_center_x = (
        left_shoulder["x"] + right_shoulder["x"]
    ) / 2
    shoulder_center_y = (
        left_shoulder["y"] + right_shoulder["y"]
    ) / 2

    shoulder_alignment = math.degrees(
        math.atan2(
            right_shoulder["y"] - left_shoulder["y"],
            right_shoulder["x"] - left_shoulder["x"],
        )
    )

    torso_lean = math.degrees(
        math.atan2(
            shoulder_center_x - hip_center_x,
            hip_center_y - shoulder_center_y,
        )
    )

    return {
        "timestamp": pose_result.get("timestamp"),
        "available": True,
        "shoulder_alignment_deg": round(
            shoulder_alignment, 2
        ),
        "torso_lean_deg": round(torso_lean, 2),
        "shoulder_width_normalized": round(
            shoulder_width, 4
        ),
    }
