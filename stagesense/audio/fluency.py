
from pathlib import Path
import json


def analyze_fluency(
    transcript_path: str | Path,
    long_pause_threshold_s: float = 0.7,
    annotations_path: str | Path | None = None,
) -> dict:
    """Analyze pauses, excluding manually reviewed speaker transitions."""
    path = Path(transcript_path)
    if not path.is_file():
        raise FileNotFoundError(f"Transcript not found: {path}")

    data = json.loads(path.read_text(encoding="utf-8-sig"))
    words = sorted(data.get("words", []), key=lambda item: item["start"])

    if not words:
        raise ValueError("Transcript contains no recognized words.")
    if long_pause_threshold_s <= 0:
        raise ValueError("Pause threshold must be positive.")

    transitions = []
    if annotations_path is not None:
        annotation_file = Path(annotations_path)
        if annotation_file.is_file():
            annotation_data = json.loads(
                annotation_file.read_text(encoding="utf-8-sig")
            )
            transitions = [
                item for item in annotation_data.get("annotations", [])
                if item.get("type") == "speaker_transition"
                and item.get("reviewed_manually") is True
            ]

    first_start = float(words[0]["start"])
    last_end = float(words[-1]["end"])
    speech_span = max(0.0, last_end - first_start)

    pauses = []
    excluded_transitions = []

    for previous, current in zip(words, words[1:]):
        gap_start = float(previous["end"])
        gap_end = float(current["start"])
        gap = max(0.0, gap_end - gap_start)

        if gap < long_pause_threshold_s:
            continue

        transition = next(
            (
                item for item in transitions
                if gap_start >= float(item["t0"]) - 0.05
                and gap_end <= float(item["t1"]) + 0.05
            ),
            None,
        )

        record = {
            "t0": round(gap_start, 3),
            "t1": round(gap_end, 3),
            "duration_s": round(gap, 3),
        }

        if transition:
            excluded_transitions.append(record)
        else:
            pauses.append(record)

    return {
        "word_count": len(words),
        "speech_span_s": round(speech_span, 3),
        "speaking_rate_wpm": round(
            len(words) / speech_span * 60, 2
        ) if speech_span > 0 else None,
        "long_pause_threshold_s": long_pause_threshold_s,
        "long_pause_count": len(pauses),
        "long_pause_total_s": round(
            sum(item["duration_s"] for item in pauses), 3
        ),
        "long_pauses": pauses,
        "excluded_transition_count": len(excluded_transitions),
        "excluded_transitions": excluded_transitions,
    }
