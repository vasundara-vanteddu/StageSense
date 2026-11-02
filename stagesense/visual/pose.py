
from pathlib import Path

import cv2
import mediapipe as mp

from stagesense.visual.video_frames import sample_video_frames


class PoseAnalysisError(Exception):
    """Raised when pose analysis fails."""


POSE_MODEL_PATH = Path("storage/models/pose_landmarker_lite.task")


def analyze_pose(
    video_path: str | Path,
    fps: float = 10.0,
    max_frames: int | None = None,
) -> list[dict]:
    """Extract pose landmarks from sampled video frames."""
    if not POSE_MODEL_PATH.is_file():
        raise FileNotFoundError(
            f"Pose model not found: {POSE_MODEL_PATH}"
        )

    options = mp.tasks.vision.PoseLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(
            model_asset_path=str(POSE_MODEL_PATH)
        ),
        running_mode=mp.tasks.vision.RunningMode.IMAGE,
        num_poses=1,
    )

    results = []

    try:
        with mp.tasks.vision.PoseLandmarker.create_from_options(
            options
        ) as landmarker:
            for timestamp, frame in sample_video_frames(
                video_path, fps=fps, max_frames=max_frames
            ):
                rgb_frame = cv2.cvtColor(
                    frame, cv2.COLOR_BGR2RGB
                )
                image = mp.Image(
                    image_format=mp.ImageFormat.SRGB,
                    data=rgb_frame,
                )
                detection = landmarker.detect(image)

                landmarks = []
                if detection.pose_landmarks:
                    for point in detection.pose_landmarks[0]:
                        landmarks.append({
                            "x": point.x,
                            "y": point.y,
                            "z": point.z,
                            "visibility": point.visibility,
                        })

                results.append({
                    "timestamp": round(timestamp, 3),
                    "detected": bool(landmarks),
                    "landmarks": landmarks,
                })

    except Exception as exc:
        if isinstance(exc, (FileNotFoundError, ValueError)):
            raise
        raise PoseAnalysisError(
            f"Pose analysis failed: {exc}"
        ) from exc

    return results
