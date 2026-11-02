
def score_speaking_rate(
    words_per_minute: float | None,
    target_min: float = 120.0,
    target_max: float = 160.0,
) -> dict:
    """Score speaking rate using a configurable target range."""
    if target_min <= 0 or target_max <= target_min:
        raise ValueError("Invalid target speaking-rate range.")

    if words_per_minute is None or words_per_minute <= 0:
        return {
            "score": None,
            "status": "unavailable",
            "words_per_minute": words_per_minute,
            "feedback": "Not enough speech data to assess speaking rate.",
        }

    if target_min <= words_per_minute <= target_max:
        score = 100.0
        status = "within_target"
        feedback = "Your speaking rate is within the target range."
    elif words_per_minute < target_min:
        score = max(
            0.0,
            100.0 * words_per_minute / target_min,
        )
        status = "below_target"
        feedback = "Consider a slightly quicker pace where appropriate."
    else:
        score = max(
            0.0,
            100.0 * target_max / words_per_minute,
        )
        status = "above_target"
        feedback = "Consider slowing down slightly for clarity."

    return {
        "score": round(score, 1),
        "status": status,
        "words_per_minute": round(words_per_minute, 2),
        "target_min_wpm": target_min,
        "target_max_wpm": target_max,
        "feedback": feedback,
    }
