
DEFAULT_WEIGHTS = {
    "speaking_rate": 0.25,
    "vocal_expressiveness": 0.20,
    "fluency": 0.20,
    "posture": 0.20,
    "gestures": 0.15,
}


def calculate_overall_score(
    scores: dict,
    weights: dict | None = None,
) -> dict:
    """Calculate a weighted average using available scores only."""
    selected_weights = weights or DEFAULT_WEIGHTS

    if not selected_weights:
        raise ValueError("At least one scoring weight is required.")

    if any(weight < 0 for weight in selected_weights.values()):
        raise ValueError("Weights cannot be negative.")

    available = {
        name: float(scores[name]["score"])
        for name in selected_weights
        if name in scores
        and scores[name].get("score") is not None
    }

    if any(not 0 <= score <= 100 for score in available.values()):
        raise ValueError("Scores must be between 0 and 100.")

    active_weight = sum(
        selected_weights[name] for name in available
    )

    if not available or active_weight <= 0:
        return {
            "overall_score": None,
            "available_dimensions": [],
            "missing_dimensions": list(selected_weights),
            "feedback": "Not enough scoring data for an overall assessment.",
        }

    overall = sum(
        available[name] * selected_weights[name]
        for name in available
    ) / active_weight

    missing = [
        name for name in selected_weights
        if name not in available
    ]

    return {
        "overall_score": round(overall, 1),
        "available_dimensions": list(available),
        "missing_dimensions": missing,
        "coverage_percent": round(
            len(available) / len(selected_weights) * 100, 1
        ),
        "feedback": (
            "Overall score is based on available dimensions only."
            if missing
            else "All scoring dimensions are available."
        ),
    }
