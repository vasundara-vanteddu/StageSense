
def score_fluency(
    long_pause_count: int | None,
    speech_span_s: float | None,
    long_pause_total_s: float | None,
    max_pause_ratio: float = 0.10,
) -> dict:
    """Score fluency using the proportion of time in long pauses."""
    if not 0 < max_pause_ratio < 1:
        raise ValueError("max_pause_ratio must be between 0 and 1.")

    if (
        long_pause_count is None
        or speech_span_s is None
        or long_pause_total_s is None
        or speech_span_s <= 0
        or long_pause_count < 0
        or long_pause_total_s < 0
    ):
        return {
            "score": None,
            "status": "unavailable",
            "feedback": "Not enough data to assess pausing.",
        }

    pause_ratio = long_pause_total_s / speech_span_s
    score = max(
        0.0,
        100.0 * (1.0 - pause_ratio / max_pause_ratio),
    )

    if pause_ratio <= max_pause_ratio * 0.5:
        status = "low_pause_ratio"
        feedback = "Long pauses occupy a relatively small share of your speech span."
    elif pause_ratio <= max_pause_ratio:
        status = "moderate_pause_ratio"
        feedback = "Review the longer pauses and check whether they help your delivery."
    else:
        status = "high_pause_ratio"
        feedback = "Review long pauses to see whether transitions could be smoother."

    return {
        "score": round(score, 1),
        "status": status,
        "long_pause_count": long_pause_count,
        "long_pause_total_s": round(long_pause_total_s, 2),
        "speech_span_s": round(speech_span_s, 2),
        "pause_ratio": round(pause_ratio, 4),
        "feedback": feedback,
    }
