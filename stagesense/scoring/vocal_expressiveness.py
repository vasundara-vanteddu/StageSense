
def score_vocal_expressiveness(
    pitch_std_hz: float | None,
    intensity_mean_db: float | None,
    min_pitch_variation_hz: float = 10.0,
    min_pitch_quality_hz: float = 75.0,
) -> dict:
    """Estimate vocal expressiveness from pitch variation.

    Intensity is reported as context, not scored directly,
    because microphone distance and recording volume affect it.
    """
    if min_pitch_variation_hz <= 0 or min_pitch_quality_hz <= 0:
        raise ValueError("Pitch thresholds must be positive.")

    if pitch_std_hz is None or pitch_std_hz < 0:
        return {
            "score": None,
            "status": "unavailable",
            "feedback": "Not enough reliable pitch data to assess vocal variation.",
        }

    score = min(
        100.0,
        (pitch_std_hz / min_pitch_variation_hz) * 100.0,
    )

    if score >= 70:
        status = "some_pitch_variation"
        feedback = "Your voice shows measurable pitch variation."
    else:
        status = "limited_pitch_variation"
        feedback = "Consider varying pitch naturally to emphasize key ideas."

    return {
        "score": round(score, 1),
        "status": status,
        "pitch_std_hz": round(pitch_std_hz, 2),
        "intensity_mean_db": (
            round(intensity_mean_db, 2)
            if intensity_mean_db is not None
            else None
        ),
        "feedback": feedback,
        "note": (
            "Preliminary heuristic; pitch variation alone does not "
            "establish presentation quality."
        ),
    }
