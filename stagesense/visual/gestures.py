
import math


def analyze_gesture_movement(
    previous_pose: dict,
    current_pose: dict,
) -> dict:
    """Measure wrist movement between two detected poses."""
    previous = previous_pose.get("landmarks", [])
    current = current_pose.get("landmarks", [])

    if (
        not previous_pose.get("detected")
        or not current_pose.get("detected")
        or len(previous) < 33
        or len(current) < 33
    ):
        return {
            "available": False,
            "reason": "Both frames need detected poses",
        }

    # MediaPipe Pose landmark indices:
    # 15 = left wrist, 16 = right wrist.
    wrist_indices = {
        "left": 15,
        "right": 16,
    }

    movement = {}

    for side, index in wrist_indices.items():
        before = previous[index]
        after = current[index]

        distance = math.hypot(
            after["x"] - before["x"],
            after["y"] - before["y"],
        )

        movement[f"{side}_wrist_displacement"] = round(
            distance, 4
        )

    movement["timestamp"] = current_pose.get("timestamp")
    movement["available"] = True

    movement["mean_wrist_displacement"] = round(
        (
            movement["left_wrist_displacement"]
            + movement["right_wrist_displacement"]
        ) / 2,
        4,
    )

    return movement
