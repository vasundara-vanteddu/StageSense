
"""Word-timestamp metrics per window. Edge handling is documented inline."""
from __future__ import annotations

import math
import re

from .config import BuildConfig

FILLERS = frozenset({"um", "umm", "uh", "uhh", "er", "erm", "ah", "hmm", "mm", "mmm"})
_NORM = re.compile(r"[^a-z']")


def num(x):
    ok = isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)
    return float(x) if ok else None


def clean_words(raw):
    """Keep well-formed words only; return (sorted words, number skipped)."""
    good, skipped = [], 0
    for w in raw if isinstance(raw, list) else []:
        s, e = (num(w.get("start")), num(w.get("end"))) if isinstance(w, dict) else (None, None)
        if s is None or e is None or s < 0 or e < s:
            skipped += 1
            continue
        good.append({
            "start": s,
            "end": e,
            "text": str(w.get("text", "")),
            "probability": num(w.get("probability")),
        })
    good.sort(key=lambda w: w["start"])
    return good, skipped


def overlap(a0, a1, b0, b1):
    return max(0.0, min(a1, b1) - max(a0, b0))


def exclusion_reason(t0, t1, manual, cfg: BuildConfig):
    """Why a silent gap must not count as a pause (None = count it)."""
    if t1 - t0 > cfg.exclude_gap_s:
        return (
            f"silence longer than {cfg.exclude_gap_s:g}s "
            "(possible speaker change or break)"
        )
    for m in manual:
        if t0 >= m["t0"] - 0.05 and t1 <= m["t1"] + 0.05:
            return "manually reviewed speaker transition"
    return None


def find_gaps(words, manual, cfg: BuildConfig):
    gaps = []
    for a, b in zip(words, words[1:]):
        t0, t1 = a["end"], b["start"]
        if t1 - t0 >= cfg.pause_min_s:
            reason = exclusion_reason(t0, t1, manual, cfg)
            gaps.append({
                "t0": t0,
                "t1": t1,
                "duration_s": t1 - t0,
                "excluded": reason is not None,
                "reason": reason,
            })
    return gaps


def window_speech_metrics(words, gaps, t0, t1, duration, cfg: BuildConfig):
    """Metrics for [t0, min(t1, duration)). Words are assigned by midpoint.

    Excluded gaps are removed from the window span. If the span is shorter than
    cfg.min_effective_s or the window has fewer than cfg.min_words_window words,
    valid=False and no pace or pause value is reported.
    """
    end = min(t1, duration)
    eff = end - t0
    m = {
        "effective_s": round(max(eff, 0.0), 3),
        "excluded_s": 0.0,
        "span_s": 0.0,
        "words": 0,
        "wpm": None,
        "pause_ratio": None,
        "long_pause_count": 0,
        "long_pause_total_s": 0.0,
        "filler_count": 0,
        "valid": False,
        "reason": None,
    }
    if eff <= 0:
        m["reason"] = "Window starts after the end of the media."
        return m

    excluded = sum(
        overlap(g["t0"], g["t1"], t0, end)
        for g in gaps if g["excluded"]
    )
    span = eff - excluded
    last = t1 >= duration

    inwin = [
        w for w in words
        if t0 <= (w["start"] + w["end"]) / 2 < end
        or (last and (w["start"] + w["end"]) / 2 == end)
    ]
    kept = [g for g in gaps if not g["excluded"]]
    long_gaps = [
        g for g in kept if g["duration_s"] >= cfg.long_pause_s
    ]

    m.update(
        excluded_s=round(excluded, 3),
        span_s=round(span, 3),
        words=len(inwin),
        filler_count=sum(
            1 for w in inwin
            if _NORM.sub("", w["text"].lower()) in FILLERS
        ),
        long_pause_count=sum(
            1 for g in long_gaps if t0 <= g["t0"] < end
        ),
        long_pause_total_s=round(
            sum(
                overlap(g["t0"], g["t1"], t0, end)
                for g in long_gaps
            ),
            3,
        ),
    )

    if span < cfg.min_effective_s:
        m["reason"] = (
            f"Only {span:.1f}s of analysable speech time in this window."
        )
    elif len(inwin) < cfg.min_words_window:
        m["reason"] = "Too few words in this window to measure pace."
    else:
        pause_time = sum(
    overlap(g["t0"], g["t1"], t0, end)
    for g in long_gaps
)
        m.update(
            valid=True,
            wpm=round(len(inwin) / span * 60, 2),
            pause_ratio=round(pause_time / span, 4),
        )
    return m
