
"""Build report.json from existing job artifacts."""
from __future__ import annotations

import argparse
import json
import math
import statistics
from pathlib import Path

from stagesense.audio.fluency import analyze_fluency
from stagesense.events.detect import detect_events
from stagesense.feedback.engine import build_feedback
from stagesense.scoring.fluency_score import score_fluency
from stagesense.scoring.score_windows import score_feature_windows
from stagesense.scoring.speaking_rate import score_speaking_rate

from .config import DIMENSIONS, LABELS, VISUAL_REASON, WEIGHTS, BuildConfig
from .schema import (
    DimensionReport,
    HeadlineMetric,
    HowCalculated,
    Meta,
    Methodology,
    Overall,
    Quality,
    Report,
    ReportWarning,
    Transcript,
    TranscriptSegment,
    WindowReport,
    WindowScore,
    save_report,
)
from .speech_metrics import (
    clean_words,
    exclusion_reason,
    find_gaps,
    num,
    window_speech_metrics,
)


class ReportBuildError(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(f"{code}: {message}")
        self.code, self.message = code, message


def adapt_score(result) -> WindowScore:
    """Convert a scorer result without inventing values."""
    if not isinstance(result, dict):
        return WindowScore(
            score=None,
            status="unavailable",
            note="Scorer returned no result.",
        )

    raw = num(result.get("score"))
    note = result.get("feedback") or result.get("message")
    status = str(result.get("status") or "unavailable")

    if raw is not None and not 0 <= raw <= 100:
        return WindowScore(
            score=None,
            status="unavailable",
            note=f"Ignored out-of-range score {raw}.",
        )

    if raw is None:
        status = "unavailable"

    return WindowScore(
        score=raw,
        status=status,
        note=str(note) if note else None,
    )


def _read_json(path: Path, *, required: bool, warnings: list, quiet: bool = False):
    if not path.is_file():
        if required:
            raise ReportBuildError(
                "MISSING_REQUIRED", f"{path.name} not found."
            )
        if not quiet:
            warnings.append(
                ReportWarning(
                    code="ARTIFACT_MISSING",
                    message=(
                        f"{path.name} not found; dependent dimensions "
                        "are unavailable."
                    ),
                )
            )
        return None

    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except (json.JSONDecodeError, UnicodeDecodeError, OSError) as exc:
        if required:
            raise ReportBuildError(
                "ARTIFACT_INVALID",
                f"{path.name} is not valid JSON: {exc}",
            ) from exc

        warnings.append(
            ReportWarning(
                code="ARTIFACT_INVALID",
                message=f"{path.name} could not be read and was ignored.",
            )
        )
        return None


def _pairs(items):
    if not isinstance(items, list) or not items:
        return None

    out = []
    for item in items:
        a, b = (
            (num(item.get("t0")), num(item.get("t1")))
            if isinstance(item, dict)
            else (None, None)
        )
        if a is None or b is None or a < 0 or b <= a:
            return None
        out.append((a, b))

    if not all(
        out[i][0] <= out[i + 1][0]
        for i in range(len(out) - 1)
    ):
        return None

    return out


def _win_list(data):
    return data.get("windows") if isinstance(data, dict) else data


def _by_t0(data):
    wins = _win_list(data)
    if not isinstance(wins, list):
        return {}

    return {
        round(w["t0"], 3): w
        for w in wins
        if isinstance(w, dict) and num(w.get("t0")) is not None
    }


def _mean(vals):
    values = [x for x in vals if x is not None]
    return round(sum(values) / len(values), 3) if values else None


def _combined_metrics(cw):
    cw = cw if isinstance(cw, dict) else {}
    a, v = cw.get("audio") or {}, cw.get("visual") or {}
    p, g = v.get("posture") or {}, v.get("gesture_movement") or {}

    pairs = {
        "pitch_median_hz": a.get("pitch_median_hz"),
        "pitch_std_hz": a.get("pitch_std_hz"),
        "intensity_mean_db": a.get("intensity_mean_db"),
        "mean_torso_lean_deg": p.get("mean_torso_lean_deg"),
        "mean_shoulder_alignment_deg": p.get("mean_shoulder_alignment_deg"),
        "valid_frame_count": p.get("valid_frame_count"),
        "mean_wrist_displacement": g.get("mean_wrist_displacement"),
        "valid_pair_count": g.get("valid_pair_count"),
    }
    return {key: num(value) for key, value in pairs.items()}


def _aggregate(vals, total, cfg):
    scored = [value for value in vals if value is not None]

    if (
        len(scored) < cfg.min_scored_windows
        or len(scored) < cfg.min_coverage * total
    ):
        return None

    mean = sum(scored) / len(scored)
    ok = sum(value >= cfg.ok_from for value in scored) / len(scored)

    return round(0.75 * mean + 25 * ok, 1), ok, len(scored), mean


def _dimension(
    key, vals, total, cfg, headline, source, reference, forced=None
):
    count = sum(value is not None for value in vals)

    how = HowCalculated(
        windows_scored=count,
        formula=(
            "Dimension score = 0.75 x mean window score + "
            f"0.25 x % of scored windows >= {cfg.ok_from:g}. "
            f"Window scores: {source}."
        ),
        reference=reference,
    )

    aggregate = None if forced else _aggregate(vals, total, cfg)

    if aggregate is None:
        need = max(
            cfg.min_scored_windows,
            math.ceil(cfg.min_coverage * total),
        )
        reason = forced or (
            f"Only {count} of {total} windows had enough reliable data "
            f"(need at least {need})."
        )
        return DimensionReport(
            key=key,
            label=LABELS[key],
            weight=WEIGHTS[key],
            available=False,
            unavailable_reason=reason,
            how_calculated=how,
        )

    score, ok, count, mean = aggregate
    return DimensionReport(
        key=key,
        label=LABELS[key],
        weight=WEIGHTS[key],
        available=True,
        score=score,
        band=cfg.band_for(score),
        pct_windows_ok=round(ok, 4),
        headline_metric=headline,
        explanation=(
            f"{count} of {total} windows were scored. "
            f"Mean window score {mean:.0f}; "
            f"{ok * 100:.0f}% of scored windows were at or above "
            f"{cfg.ok_from:g}."
        ),
        how_calculated=how,
    )


def _overall(dims, cfg):
    available = [d for d in dims if d.available]

    if len(available) < cfg.min_dimensions_for_overall:
        return Overall(
            score=None,
            band=None,
            dimensions_scored=len(available),
            summary=(
                "Not enough reliable evidence for an overall score "
                f"({len(available)} of 6 dimensions available)."
            ),
        )

    score = round(
        sum(d.weight * d.score for d in available)
        / sum(d.weight for d in available),
        1,
    )
    highest = max(available, key=lambda d: d.score)
    lowest = min(available, key=lambda d: d.score)

    return Overall(
        score=score,
        band=cfg.band_for(score),
        dimensions_scored=len(available),
        summary=(
            f"Overall delivery indicator {score:.0f}/100 "
            f"({cfg.band_for(score)}), based on "
            f"{len(available)} of 6 dimensions. "
            f"Highest: {highest.label} ({highest.score:.0f}). "
            f"Lowest: {lowest.label} ({lowest.score:.0f}). "
            "Indicators of delivery, not grades."
        ),
    )


def _methodology(cfg):
    return Methodology(
        weights=dict(WEIGHTS),
        bands={
            "speaking_rate_wpm_target": list(cfg.wpm_target),
            "fluency_max_pause_ratio": [cfg.max_pause_ratio],
            "vocal_min_pitch_variation_hz": [
                cfg.min_pitch_variation_hz
            ],
            "posture_neutral_tolerance_deg": [
                cfg.posture_tolerance_deg
            ],
            "gesture_reference_displacement": [
                cfg.gesture_reference
            ],
        },
        thresholds={
            "severe_below": cfg.severe_below,
            "weak_below": cfg.weak_below,
            "strong_from": cfg.strong_from,
            "ok_from": cfg.ok_from,
            "pause_min_s": cfg.pause_min_s,
            "long_pause_s": cfg.long_pause_s,
            "exclude_gap_s": cfg.exclude_gap_s,
        },
        reference=(
            "All target ranges and thresholds are project heuristics "
            "(defaults of the scoring modules). None has been validated "
            "against human ratings or published norms."
        ),
        limitations=[
            "No validation against human raters has been performed.",
            "English speech only; accuracy depends on speech-recognition quality and accent.",
            "Filler words are often omitted by speech recognition, so counts are lower bounds.",
            f"Silences longer than {cfg.exclude_gap_s:g}s are excluded from pause analysis (possible speaker changes or breaks).",
            "Visual features are sampled at low frame rates; posture and gestures are 2D camera estimates.",
            "Visual Engagement is not available in this version.",
            "The system assumes one speaker; multiple speakers or off-camera speech can distort results.",
            "Target ranges are not adjusted for speaker, language or presentation style.",
        ],
    )


def build_report(
    job_dir,
    *,
    job_id=None,
    filename=None,
    annotations_path=None,
    cfg: BuildConfig | None = None,
    write: bool = True,
) -> Report:
    cfg = cfg or BuildConfig()
    job = Path(job_dir)
    warnings: list[ReportWarning] = []

    word_data = _read_json(
        job / "words.json", required=True, warnings=warnings
    )
    if not isinstance(word_data, dict):
        raise ReportBuildError(
            "ARTIFACT_INVALID", "words.json must be a JSON object."
        )

    words, skipped = clean_words(word_data.get("words"))

    if len(words) < cfg.min_words_total:
        raise ReportBuildError(
            "NO_SPEECH_DETECTED",
            f"Only {len(words)} words recognised "
            f"(need at least {cfg.min_words_total}).",
        )

    if skipped:
        warnings.append(
            ReportWarning(
                code="WORDS_SKIPPED",
                message=f"{skipped} malformed word entries were skipped.",
            )
        )

    duration = max(
        num(word_data.get("duration_s")) or 0.0,
        words[-1]["end"],
    )
    if duration <= 0:
        raise ReportBuildError(
            "ARTIFACT_INVALID", "Media duration is not positive."
        )

    manual = []
    if annotations_path:
        annotations = _read_json(
            Path(annotations_path), required=False, warnings=warnings
        )
        annotation_list = (
            annotations.get("annotations", [])
            if isinstance(annotations, dict)
            else []
        )
        for item in annotation_list:
            if (
                isinstance(item, dict)
                and item.get("type") == "speaker_transition"
                and item.get("reviewed_manually") is True
                and num(item.get("t0")) is not None
                and num(item.get("t1")) is not None
                and item["t1"] > item["t0"]
            ):
                manual.append({
                    "t0": float(item["t0"]),
                    "t1": float(item["t1"]),
                })

    try:
        fluency = analyze_fluency(
            job / "words.json",
            long_pause_threshold_s=cfg.long_pause_s,
        )
    except (ValueError, FileNotFoundError, KeyError) as exc:
        raise ReportBuildError(
            "ARTIFACT_INVALID", f"Fluency analysis failed: {exc}"
        ) from exc

    gaps = find_gaps(words, manual, cfg)
    excluded = [gap for gap in gaps if gap["excluded"]]
    span = max(
        0.0,
        float(fluency["speech_span_s"])
        - sum(gap["duration_s"] for gap in excluded),
    )
    wpm_all = (
        round(fluency["word_count"] / span * 60, 1)
        if span > 0 else None
    )
    long_pauses = [
        pause for pause in fluency["long_pauses"]
        if exclusion_reason(
            pause["t0"], pause["t1"], manual, cfg
        ) is None
    ]
    long_per_min = (
        round(len(long_pauses) / (span / 60), 2)
        if span > 0 else None
    )

    for gap in excluded[:10]:
        warnings.append(
            ReportWarning(
                code="EXCLUDED_SILENCE",
                t0=round(gap["t0"], 2),
                t1=round(gap["t1"], 2),
                message=(
                    f"{gap['duration_s']:.1f}s gap excluded from "
                    f"pause analysis: {gap['reason']}."
                ),
            )
        )

    if len(excluded) > 10:
        warnings.append(
            ReportWarning(
                code="EXCLUDED_SILENCE",
                message=f"{len(excluded) - 10} more gaps excluded.",
            )
        )

    visual = _read_json(
        job / "visual_features.json",
        required=False,
        warnings=warnings,
    )
    combined = _read_json(
        job / "combined_features.json",
        required=False,
        warnings=warnings,
    )
    window_scores = _read_json(
        job / "window_scores.json",
        required=False,
        warnings=warnings,
        quiet=True,
    )
    acoustic = _read_json(
        job / "acoustic_features.json",
        required=False,
        warnings=warnings,
        quiet=True,
    )

    if (
        window_scores is None
        and isinstance(combined, dict)
        and _pairs(combined.get("windows"))
    ):
        try:
            window_scores = score_feature_windows(
                job / "combined_features.json",
                job / "window_scores.json",
            )
        except Exception as exc:
            warnings.append(
                ReportWarning(
                    code="ARTIFACT_INVALID",
                    message=f"Window scoring failed: {exc}",
                )
            )
    elif window_scores is None:
        warnings.append(
            ReportWarning(
                code="ARTIFACT_MISSING",
                message=(
                    "window_scores.json not found; vocal, posture and "
                    "gesture dimensions are unavailable."
                ),
            )
        )

    grid = next(
        (
            pairs
            for pairs in (
                _pairs(_win_list(source))
                for source in (window_scores, combined, acoustic)
                if source is not None
            )
            if pairs
        ),
        None,
    )

    if grid is None:
        grid = [
            (k * cfg.hop_s, k * cfg.hop_s + cfg.window_s)
            for k in range(max(1, math.ceil(duration / cfg.hop_s)))
        ]

    window_map = _by_t0(window_scores)
    combined_map = _by_t0(combined)
    lo, hi = cfg.wpm_target
    windows: list[WindowReport] = []

    for i, (t0, t1) in enumerate(grid):
        key = round(t0, 3)
        speech = window_speech_metrics(
            words, gaps, t0, t1, duration, cfg
        )
        scores: dict[str, WindowScore] = {}

        if speech["valid"]:
            scores["speaking_rate"] = adapt_score(
                score_speaking_rate(
                    speech["wpm"],
                    target_min=lo,
                    target_max=hi,
                )
            )
            scores["pausing_fluency"] = adapt_score(
                score_fluency(
                    long_pause_count=speech["long_pause_count"],
                    speech_span_s=speech["span_s"],
                    long_pause_total_s=speech["long_pause_total_s"],
                    max_pause_ratio=cfg.max_pause_ratio,
                )
            )
        else:
            scores["speaking_rate"] = WindowScore(
                score=None,
                status="unavailable",
                note=speech["reason"],
            )
            scores["pausing_fluency"] = WindowScore(
                score=None,
                status="unavailable",
                note=speech["reason"],
            )

        for dim in (
            "vocal_expressiveness",
            "posture",
            "gestures",
        ):
            raw = (
                (window_map.get(key) or {}).get("scores") or {}
            ).get(dim)
            scores[dim] = (
                adapt_score(raw)
                if raw is not None
                else WindowScore(
                    score=None,
                    status="unavailable",
                    note="No scored data for this window.",
                )
            )

        scores["visual_engagement"] = WindowScore(
            score=None,
            status="unavailable",
            note=VISUAL_REASON,
        )
        scores = {key: scores[key] for key in DIMENSIONS}

        available_scores = {
            key: value.score
            for key, value in scores.items()
            if value.score is not None
        }
        composite = (
            round(
                sum(WEIGHTS[key] * score for key, score in available_scores.items())
                / sum(WEIGHTS[key] for key in available_scores),
                1,
            )
            if len(available_scores) >= 2
            else None
        )

        metrics = _combined_metrics(combined_map.get(key))
        metrics.update({
            name: speech[name]
            for name in (
                "effective_s",
                "excluded_s",
                "words",
                "wpm",
                "pause_ratio",
                "long_pause_count",
                "long_pause_total_s",
                "filler_count",
            )
        })

        windows.append(
            WindowReport(
                i=i,
                t0=t0,
                t1=t1,
                composite=composite,
                scores=scores,
                states={
                    key: cfg.state_for(value.score)
                    for key, value in scores.items()
                },
                metrics=metrics,
            )
        )

    def column(key):
        return [window.scores[key].score for window in windows]

    count_windows = len(windows)
    heuristic = (
        "Project heuristic (scorer default parameters); "
        "not validated against human ratings."
    )

    dimensions = [
        _dimension(
            "speaking_rate",
            column("speaking_rate"),
            count_windows,
            cfg,
            HeadlineMetric(
                name="Words per minute",
                value=wpm_all,
                unit="wpm",
                target_low=lo,
                target_high=hi,
            ),
            "score_speaking_rate on words per minute in each window",
            f"{heuristic} Target {lo:g}-{hi:g} wpm.",
        ),
        _dimension(
            "vocal_expressiveness",
            column("vocal_expressiveness"),
            count_windows,
            cfg,
            HeadlineMetric(
                name="Mean pitch spread",
                value=_mean(
                    window.metrics.get("pitch_std_hz")
                    for window in windows
                ),
                unit="Hz",
                target_low=cfg.min_pitch_variation_hz,
            ),
            "score_vocal_expressiveness (window_scores.json)",
            heuristic,
        ),
        _dimension(
            "pausing_fluency",
            column("pausing_fluency"),
            count_windows,
            cfg,
            HeadlineMetric(
                name="Long pauses per minute",
                value=long_per_min,
                unit="/min",
            ),
            f"score_fluency on pauses >= {cfg.long_pause_s:g}s in each window",
            f"{heuristic} Max pause ratio {cfg.max_pause_ratio:g}. Fillers are counted but not scored.",
        ),
        _dimension(
            "gestures",
            column("gestures"),
            count_windows,
            cfg,
            HeadlineMetric(
                name="Mean wrist displacement",
                value=_mean(
                    window.metrics.get("mean_wrist_displacement")
                    for window in windows
                ),
                unit="",
            ),
            "score_gesture_activity (window_scores.json)",
            f"{heuristic} Reference displacement {cfg.gesture_reference:g}.",
        ),
        _dimension(
            "posture",
            column("posture"),
            count_windows,
            cfg,
            HeadlineMetric(
                name="Mean torso lean",
                value=_mean(
                    window.metrics.get("mean_torso_lean_deg")
                    for window in windows
                ),
                unit="deg",
            ),
            "score_posture (window_scores.json)",
            f"{heuristic} Neutral tolerance {cfg.posture_tolerance_deg:g} deg.",
        ),
        _dimension(
            "visual_engagement",
            column("visual_engagement"),
            count_windows,
            cfg,
            None,
            "not implemented",
            "Not applicable.",
            forced=VISUAL_REASON,
        ),
    ]

    probabilities = [
        word["probability"]
        for word in words
        if word["probability"] is not None
    ]
    confidence = (
        round(sum(probabilities) / len(probabilities), 3)
        if probabilities else None
    )

    if confidence is not None and confidence < cfg.asr_conf_warn:
        warnings.append(
            ReportWarning(
                code="ASR_LOW_CONFIDENCE",
                message=(
                    "Speech recognition confidence is low; pace and "
                    "filler results may be unreliable."
                ),
            )
        )

    language = str(word_data.get("language") or "unknown")
    if language != "en":
        warnings.append(
            ReportWarning(
                code="LANGUAGE_NOT_ENGLISH",
                message=(
                    f"Detected language '{language}'; "
                    "StageSense supports English."
                ),
            )
        )

    if len(words) >= 200 and not sum(
        window.metrics["filler_count"] or 0 for window in windows
    ):
        warnings.append(
            ReportWarning(
                code="NO_FILLERS_TRANSCRIBED",
                message=(
                    "No filler words were transcribed. Speech recognition "
                    "often omits them, so filler counts are lower bounds."
                ),
            )
        )

    visual_fraction = sampling_fps = None
    if isinstance(visual, dict):
        frames = num(visual.get("frames_analyzed"))
        detected = num(visual.get("detected_frames"))
        visual_fraction = (
            round(detected / frames, 3)
            if frames and detected is not None
            else None
        )
        sampling_fps = num(visual.get("sampling_fps"))

        if (
            visual_fraction is not None
            and visual_fraction < cfg.visual_valid_warn
        ):
            warnings.append(
                ReportWarning(
                    code="VISUAL_LOW_QUALITY",
                    message=(
                        "The speaker was tracked in under half of "
                        "the sampled frames."
                    ),
                )
            )

    events = detect_events(windows, duration, cfg)
    actual_job_id = job_id or job.name
    feedback = build_feedback(
        events, dimensions, actual_job_id, cfg
    )

    segments = []
    for segment in word_data.get("segments") or []:
        start, end = (
            (num(segment.get("t0")), num(segment.get("t1")))
            if isinstance(segment, dict)
            else (None, None)
        )
        if start is not None and end is not None and end > start:
            segments.append(
                TranscriptSegment(
                    t0=start,
                    t1=end,
                    text=str(segment.get("text", "")),
                )
            )

    if not segments:
        warnings.append(
            ReportWarning(
                code="NO_TRANSCRIPT_SEGMENTS",
                message="No transcript segments were available.",
            )
        )

    hop = statistics.median(
        [b[0] - a[0] for a, b in zip(grid, grid[1:])]
        or [cfg.hop_s]
    )
    window_size = statistics.median(
        [end - start for start, end in grid]
    )

    filename_value = filename or (
        Path(visual["video_path"]).name
        if isinstance(visual, dict) and visual.get("video_path")
        else job.name
    )

    report = Report(
        job_id=actual_job_id,
        meta=Meta(
            filename=filename_value,
            duration_s=duration,
            language=language,
            window_s=window_size,
            hop_s=hop,
            n_windows=count_windows,
            pipeline_version=cfg.pipeline_version,
            asr_model=cfg.asr_model,
            visual_sampling_fps=sampling_fps,
            quality=Quality(
                speech_words=len(words),
                asr_mean_confidence=confidence,
                visual_valid_fraction=visual_fraction,
                warnings=warnings,
            ),
        ),
        overall=_overall(dimensions, cfg),
        dimensions=dimensions,
        windows=windows,
        events=events,
        feedback=feedback,
        transcript=Transcript(segments=segments),
        methodology=_methodology(cfg),
    )

    if write:
        save_report(report, job / "report.json")

    return report


def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Build report.json from a job folder."
    )
    parser.add_argument("job_dir")
    parser.add_argument(
        "--annotations",
        help="Optional manual annotations (evaluation fixtures only).",
    )
    parser.add_argument("--filename")
    args = parser.parse_args(argv)

    try:
        report = build_report(
            args.job_dir,
            annotations_path=args.annotations,
            filename=args.filename,
        )
    except ReportBuildError as exc:
        raise SystemExit(f"ERROR {exc.code}: {exc.message}")

    print(f"Wrote {Path(args.job_dir) / 'report.json'}")
    print(
        f"Overall: {report.overall.score} ({report.overall.band}) "
        f"from {report.overall.dimensions_scored}/6 dimensions"
    )
    for dimension in report.dimensions:
        value = (
            f"{dimension.score:.1f}"
            if dimension.available
            else f"unavailable: {dimension.unavailable_reason}"
        )
        print(f"  {dimension.key:22s} {value}")

    print(
        f"Windows: {len(report.windows)}  Events: {len(report.events)}  "
        f"Warnings: {len(report.meta.quality.warnings)}"
    )
    for warning in report.meta.quality.warnings:
        print(f"  [{warning.code}] {warning.message}")


if __name__ == "__main__":
    main()
