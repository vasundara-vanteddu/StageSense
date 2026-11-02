
"""Weak and strong events from real window states. No evidence means no events."""
from __future__ import annotations

import math

from stagesense.report.config import DIMENSIONS, BuildConfig
from stagesense.report.schema import Event, EventMetric, WindowReport

_COMPOUNDS = {
    frozenset({"pace_fast", "gesture_static"}): "rushed_and_static",
    frozenset({"flat_pitch", "gesture_static"}): "low_energy",
}


def _mean(ws, key):
    v = [w.metrics[key] for w in ws if isinstance(w.metrics.get(key), (int, float))]
    return sum(v) / len(v) if v else None


def _r(x):
    return None if x is None else round(x, 3)


def _subtype_metric(dim, ws, cfg: BuildConfig):
    lo, hi = cfg.wpm_target
    if dim == "speaking_rate":
        wpm = _mean(ws, "wpm")
        sub = "pace_fast" if wpm is not None and wpm > hi else "pace_slow"
        return sub, EventMetric(
            name="Words per minute", value=_r(wpm), unit="wpm",
            target_low=lo, target_high=hi,
        )
    if dim == "vocal_expressiveness":
        ps = _mean(ws, "pitch_std_hz")
        sub = (
            "flat_pitch"
            if ps is not None and ps < cfg.min_pitch_variation_hz
            else "vocal_variation"
        )
        return sub, EventMetric(
            name="Pitch spread", value=_r(ps), unit="Hz",
            target_low=cfg.min_pitch_variation_hz,
        )
    if dim == "pausing_fluency":
        lt = _mean(ws, "long_pause_total_s")
        sub = "pause_long" if lt and lt > 0 else "pause_excess"
        return sub, EventMetric(
            name="Long-pause time per window", value=_r(lt), unit="s",
        )
    if dim == "posture":
        return "posture_lean", EventMetric(
            name="Mean torso lean",
            value=_r(_mean(ws, "mean_torso_lean_deg")),
            unit="deg",
            target_low=-cfg.posture_tolerance_deg,
            target_high=cfg.posture_tolerance_deg,
        )
    if dim == "gestures":
        d = _mean(ws, "mean_wrist_displacement")
        sub = (
            "gesture_static"
            if d is not None and d < cfg.gesture_reference
            else "gesture_excess"
        )
        return sub, EventMetric(
            name="Mean wrist displacement", value=_r(d),
            target_low=cfg.gesture_reference,
        )
    return "unknown", None


def _scores(ws, dim):
    return [
        w.scores[dim].score
        for w in ws
        if w.scores[dim].score is not None
    ]


def _weak_candidates(dim, windows, duration, cfg):
    idx = [
        k for k, w in enumerate(windows)
        if w.states.get(dim) in ("weak", "severe")
    ]
    runs, cur = [], []

    for k in idx:
        if not cur:
            cur = [k]
        elif k - cur[-1] == 1:
            cur.append(k)
        elif (
            k - cur[-1] == 2
            and _bridgeable(windows[cur[-1] + 1], dim, cfg)
        ):
            cur.extend([cur[-1] + 1, k])
        else:
            runs.append(cur)
            cur = [k]

    if cur:
        runs.append(cur)

    out = []
    for run in runs:
        ws = [windows[k] for k in run]
        t0, t1 = ws[0].t0, min(ws[-1].t1, duration)
        dur = t1 - t0
        severe = any(w.states[dim] == "severe" for w in ws)

        if dur <= 0 or (dur < cfg.event_min_duration_s and not severe):
            continue

        sc = _scores(ws, dim)
        if not sc:
            continue

        mean = sum(sc) / len(sc)
        sub, metric = _subtype_metric(dim, ws, cfg)
        out.append({
            "kind": "weak",
            "dimension": dim,
            "subtype": sub,
            "metric": metric,
            "severity": "severe" if severe else "weak",
            "t0": t0,
            "t1": t1,
            "mean": mean,
            "rank": max(0.0, cfg.weak_below - mean) * math.sqrt(dur),
        })
    return out


def _bridgeable(w, dim, cfg):
    s = w.scores[dim].score
    return s is not None and s < cfg.event_bridge_below


def _strong_candidates(dim, windows, duration, cfg):
    out, cur = [], []

    for k, w in enumerate(windows + [None]):
        if w is not None and w.states.get(dim) == "strong":
            cur.append(w)
            continue

        if len(cur) >= cfg.strong_min_windows:
            t0, t1 = cur[0].t0, min(cur[-1].t1, duration)
            sc = _scores(cur, dim)

            if sc and t1 > t0:
                mean = sum(sc) / len(sc)
                _, metric = _subtype_metric(dim, cur, cfg)
                out.append({
                    "kind": "strong",
                    "dimension": dim,
                    "subtype": "strong",
                    "metric": metric,
                    "severity": "strong",
                    "t0": t0,
                    "t1": t1,
                    "mean": mean,
                    "rank": mean * (t1 - t0),
                })
        cur = []

    return out


def detect_events(
    windows: list[WindowReport],
    duration: float,
    cfg: BuildConfig,
) -> list[Event]:
    weak, strong = [], []

    for dim in DIMENSIONS:
        weak += _weak_candidates(dim, windows, duration, cfg)
        strong += _strong_candidates(dim, windows, duration, cfg)

    kept, per_dim = [], {}
    for c in sorted(weak, key=lambda c: -c["rank"]):
        if (
            len(kept) >= cfg.max_weak_events
            or per_dim.get(c["dimension"], 0) >= cfg.max_weak_per_dimension
        ):
            continue
        per_dim[c["dimension"]] = per_dim.get(c["dimension"], 0) + 1
        kept.append(c)

    strong = sorted(strong, key=lambda c: -c["rank"])[:cfg.max_strong_events]
    chosen = sorted(kept + strong, key=lambda c: (c["t0"], c["dimension"]))

    events = [
        Event(
            id=f"e{n}",
            kind=c["kind"],
            dimension=c["dimension"],
            subtype=c["subtype"],
            severity=c["severity"],
            t0=round(c["t0"], 2),
            t1=round(c["t1"], 2),
            mean_score=round(c["mean"], 1),
            impact=round(c["rank"], 2),
            metric=c["metric"],
        )
        for n, c in enumerate(chosen, 1)
    ]

    _tag_compounds(events)
    return events


def _tag_compounds(events):
    weak = [e for e in events if e.kind == "weak"]

    for i, a in enumerate(weak):
        for b in weak[i + 1:]:
            if a.dimension == b.dimension:
                continue

            ov = max(0.0, min(a.t1, b.t1) - max(a.t0, b.t0))
            if ov >= 0.5 * min(a.t1 - a.t0, b.t1 - b.t0):
                tag = _COMPOUNDS.get(frozenset({a.subtype, b.subtype}))
                if tag:
                    a.compound = b.compound = tag