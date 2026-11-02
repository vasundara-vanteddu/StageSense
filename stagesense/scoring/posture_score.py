
def score_posture(
    mean_torso_lean_deg: float | None,
    neutral_tolerance_deg: float = 10.0,
) -> dict:
    """Provide a preliminary score based on torso lean."""
    if neutral_tolerance_deg <= 0:
        raise ValueError("Tolerance must be positive.")

    if mean_torso_lean_deg is None:
        return {
            "score": None,
            "status": "unavailable",
            "feedback": "Not enough visible pose data to assess torso alignment.",
        }

    deviation = abs(mean_torso_lean_deg)

    score = max(
        0.0,
        100.0 * (1.0 - deviation / (neutral_tolerance_deg * 3)),
    )

    if deviation <= neutral_tolerance_deg:
        status = "within_reference"
        feedback = "Your measured torso alignment is near the reference position."
    else:
        status = "noticeable_lean"
        feedback = "Review this segment to check whether your torso position is comfortable and intentional."

    return {
        "score": round(score, 1),
        "status": status,
        "mean_torso_lean_deg": round(mean_torso_lean_deg, 2),
        "neutral_tolerance_deg": neutral_tolerance_deg,
        "feedback": feedback,
        "note": "Preliminary geometric heuristic; camera angle and body orientation can affect this measurement.",
    }
