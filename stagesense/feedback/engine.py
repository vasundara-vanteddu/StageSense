
"""Deterministic template feedback. Every number comes from a measured event metric."""
from __future__ import annotations

import hashlib

from stagesense.report.config import LABELS, BuildConfig
from stagesense.report.schema import (
    DimensionReport,
    Event,
    Feedback,
    Strength,
    TimelineItem,
    TopImprovement,
)

_T = {
    "pace_fast": (
        "Pace picked up",
        "Between {span} you spoke faster than the reference range.",
        (
            "Pause briefly after each key point.",
            "Take a breath at the end of every sentence.",
            "Mark two places in your notes where you slow down on purpose.",
        ),
    ),
    "pace_slow": (
        "Pace slowed",
        "Between {span} you spoke slower than the reference range.",
        (
            "Tighten the transitions between points.",
            "Rehearse this section aloud at conversational speed.",
        ),
    ),
    "flat_pitch": (
        "Limited pitch variation",
        "Between {span} your pitch varied little.",
        (
            "Stress the one or two words that carry each point.",
            "Lift your pitch on questions and key terms.",
        ),
    ),
    "vocal_variation": (
        "Vocal delivery",
        "Between {span} the vocal-expressiveness score was lower than elsewhere.",
        ("Re-listen to this section and mark where your voice flattened.",),
    ),
    "pause_long": (
        "Long pauses",
        "Between {span} there were long pauses. A deliberate pause can be flagged too.",
        (
            "If a pause is deliberate, follow it with a clear signpost.",
            "Rehearse the transition into the next point.",
        ),
    ),
    "pause_excess": (
        "Frequent pauses",
        "Between {span} pausing was more frequent than elsewhere.",
        ("Rehearse this section until the next point comes without hesitation.",),
    ),
    "posture_lean": (
        "Torso lean",
        "Between {span} your torso lean was outside the neutral range.",
        (
            "Check your camera height and stand or sit square to it.",
            "Reset your posture at each slide change.",
        ),
    ),
    "gesture_static": (
        "Little hand movement",
        "Between {span} your wrists moved very little.",
        (
            "Use one deliberate gesture on each key point.",
            "Keep your hands in frame.",
        ),
    ),
    "gesture_excess": (
        "Busy hands",
        "Between {span} your hands moved more than elsewhere.",
        ("Settle your hands between points.",),
    ),
}

_GENERIC = (
    "{label} stood out",
    "Between {span} {label} was weaker than elsewhere.",
    ("Re-watch this section and note what changed.",),
)


def fmt_time(s: float) -> str:
    m, sec = divmod(int(round(s)), 60)
    return f"{m:02d}:{sec:02d}"


def _g(x):
    return f"{x:.2f}".rstrip("0").rstrip(".")


def _measure(ev: Event) -> str:
    m = ev.metric
    if m is None or m.value is None:
        return ""

    unit = f" {m.unit}" if m.unit else ""
    ref = ""

    if m.target_low is not None and m.target_high is not None:
        ref = (
            f" (reference {_g(m.target_low)} to "
            f"{_g(m.target_high)}{unit})"
        )
    elif m.target_low is not None:
        ref = f" (reference at least {_g(m.target_low)}{unit})"
    elif m.target_high is not None:
        ref = f" (reference up to {_g(m.target_high)}{unit})"

    return f" Measured {m.name.lower()}: {_g(m.value)}{unit}{ref}."


def describe(ev: Event, job_id: str):
    span = f"{fmt_time(ev.t0)} and {fmt_time(ev.t1)}"
    label = LABELS.get(ev.dimension, ev.dimension)

    if ev.kind == "strong":
        return (
            f"Strong stretch: {label}",
            f"Between {span} {label} scored consistently high.",
            "Notice what you were doing here and repeat it.",
        )

    title, base, tips = _T.get(ev.subtype, _GENERIC)
    tip_index = int(
        hashlib.sha1(f"{job_id}:{ev.id}".encode()).hexdigest(), 16
    ) % len(tips)

    return (
        title.format(label=label),
        base.format(span=span, label=label) + _measure(ev),
        tips[tip_index],
    )


def build_feedback(
    events: list[Event],
    dims: list[DimensionReport],
    job_id: str,
    cfg: BuildConfig,
) -> Feedback:
    items, texts = [], {}

    for ev in events:
        title, body, tip = describe(ev, job_id)
        texts[ev.id] = (title, body)
        items.append(
            TimelineItem(
                event_id=ev.id,
                t0=ev.t0,
                t1=ev.t1,
                title=title,
                body=body,
                tip=tip,
            )
        )

    candidates = sorted(
        (
            d for d in dims
            if d.available and d.score is not None and d.score < 70
        ),
        key=lambda d: -d.weight * (100 - d.score),
    )[:3]

    tops = []
    for rank, d in enumerate(candidates, 1):
        evs = sorted(
            (
                e for e in events
                if e.kind == "weak" and e.dimension == d.key
            ),
            key=lambda e: -(e.impact or 0),
        )[:2]

        if evs:
            title, body = texts[evs[0].id]
            title = f"{d.label}: {title}"
        else:
            pct = (d.pct_windows_ok or 0) * 100
            title = f"{d.label} needs attention"
            body = (
                f"{d.label} scored {d.score:.0f}/100, with "
                f"{pct:.0f}% of scored windows at or above "
                f"{cfg.ok_from:.0f}. No single stretch stood out, "
                "so the pattern is spread across the recording."
            )

        tops.append(
            TopImprovement(
                rank=rank,
                dimension=d.key,
                title=title,
                body=body,
                event_ids=[e.id for e in evs],
                t0=evs[0].t0 if evs else None,
            )
        )

    strengths = [
        Strength(
            event_id=e.id,
            title=texts[e.id][0],
            body=texts[e.id][1],
            t0=e.t0,
            t1=e.t1,
        )
        for e in events
        if e.kind == "strong"
    ]

    if not strengths:
        for d in sorted(
            (
                d for d in dims
                if d.available and d.score is not None and d.score >= 75
            ),
            key=lambda d: -d.score,
        )[:2]:
            strengths.append(
                Strength(
                    title=f"{d.label} was consistent",
                    body=(
                        f"{d.label} scored {d.score:.0f}/100 across "
                        f"{d.how_calculated.windows_scored} scored windows."
                    ),
                )
            )

    return Feedback(
        top_improvements=tops,
        strengths=strengths,
        timeline_items=items,
    )