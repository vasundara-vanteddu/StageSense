
def score_gesture_activity(
    mean_wrist_displacement: float | None,
    reference_displacement: float = 0.05,
) -> dict:
    """Summarize wrist movement using a configurable reference."""
    if reference_displacement <= 0:
        raise ValueError("Reference displacement must be positive.")

    if (
        mean_wrist_displacement is None
        or mean_wrist_displacement < 0
    ):
        return {
            "score": None,
            "status": "unavailable",
            "feedback": "Not enough wrist-movement data to assess gesture activity.",
        }

    score = min(
        100.0,
        mean_wrist_displacement / reference_displacement * 100.0,
    )

    if score < 30:
        status = "low_movement"
        feedback = "Limited wrist movement was detected. Consider whether natural gestures would support your message."
    elif score < 70:
        status = "moderate_movement"
        feedback = "Some wrist movement was detected during this segment."
    else:
        status = "high_movement"
        feedback = "Frequent wrist movement was detected. Review whether the gestures support your message."

    return {
        "score": round(score, 1),
        "status": status,
        "mean_wrist_displacement": round(
            mean_wrist_displacement, 4
        ),
        "reference_displacement": reference_displacement,
        "feedback": feedback,
        "note": "Movement quantity does not establish gesture quality or communicative intent.",
    }
