
import json

import pytest

from stagesense.report.builder import ReportBuildError, adapt_score, build_report
from stagesense.report.config import DIMENSIONS
from stagesense.report.schema import load_report
from stagesense.scoring.speaking_rate import score_speaking_rate


def block(start, n, step=0.4):
    return [
        {
            "start": round(start + step * i, 3),
            "end": round(start + step * i + 0.3, 3),
            "text": "word",
            "probability": 0.9,
        }
        for i in range(n)
    ]


def write(path, obj):
    path.write_text(json.dumps(obj), encoding="utf-8")


def make_job(
    tmp_path,
    words=None,
    duration=60.0,
    full=False,
    weak_gesture=(),
    severe_posture=(),
    weak_vocal=(),
):
    words = words if words is not None else block(0.2, 145)

    write(
        tmp_path / "words.json",
        {
            "language": "en",
            "duration_s": duration,
            "words": words,
            "segments": [
                {"t0": 0.2, "t1": 5.0, "text": "word word word"}
            ],
        },
    )

    if full:
        grid = [(5 * k, 5 * k + 10) for k in range(12)]
        combined, scores = [], []

        for k, (t0, t1) in enumerate(grid):
            displacement = 0.01 if k in weak_gesture else 0.08

            combined.append(
                {
                    "t0": t0,
                    "t1": t1,
                    "audio": {
                        "pitch_median_hz": 120,
                        "pitch_std_hz": 25,
                        "intensity_mean_db": -30,
                    },
                    "visual": {
                        "posture": {
                            "mean_torso_lean_deg": 3,
                            "mean_shoulder_alignment_deg": 1,
                            "valid_frame_count": 8,
                        },
                        "gesture_movement": {
                            "mean_wrist_displacement": displacement,
                            "valid_pair_count": 8,
                        },
                    },
                }
            )

            def scorer(score):
                return {"score": score, "status": "ok", "feedback": "f"}

            scores.append(
                {
                    "t0": t0,
                    "t1": t1,
                    "scores": {
                        "vocal_expressiveness": scorer(
                            50 if k in weak_vocal else 80
                        ),
                        "posture": scorer(
                            10 if k in severe_posture else 80
                        ),
                        "gestures": scorer(
                            20 if k in weak_gesture else 80
                        ),
                    },
                }
            )

        write(tmp_path / "combined_features.json", {"windows": combined})
        write(tmp_path / "window_scores.json", {"windows": scores})
        write(
            tmp_path / "visual_features.json",
            {
                "video_path": "v.webm",
                "sampling_fps": 1,
                "frames_analyzed": 60,
                "detected_frames": 55,
            },
        )

    return tmp_path


def test_scorer_scale_assumption():
    normal = adapt_score(score_speaking_rate(140.0))
    fast = adapt_score(score_speaking_rate(220.0))

    assert normal.score is not None and normal.score >= 50
    assert fast.score is not None and fast.score < normal.score


def test_minimal_job_valid_and_roundtrip(tmp_path):
    job = make_job(tmp_path)
    report = build_report(job)

    assert load_report(job / "report.json") == report

    dimensions = {dimension.key: dimension for dimension in report.dimensions}
    assert len(dimensions) == 6
    assert dimensions["speaking_rate"].available
    assert not dimensions["visual_engagement"].available
    assert dimensions["visual_engagement"].score is None
    assert not dimensions["gestures"].available
    assert dimensions["gestures"].unavailable_reason
    assert any(
        warning.code == "ARTIFACT_MISSING"
        for warning in report.meta.quality.warnings
    )


def test_full_job_events_and_feedback(tmp_path):
    job = make_job(
        tmp_path,
        full=True,
        weak_gesture=(2, 3, 4, 5),
        severe_posture=(7,),
        weak_vocal=(8, 9, 10),
    )

    report = build_report(job)

    assert len(report.windows) == 12
    assert report.feedback is not None
    assert all(
        item.event_id in {event.id for event in report.events}
        for item in report.feedback.timeline_items
    )
    assert all(event.t1 > event.t0 for event in report.events)


def test_overall_uses_only_available_dimensions(tmp_path):
    report = build_report(make_job(tmp_path, full=True))

    available = [dimension for dimension in report.dimensions if dimension.available]
    assert report.overall.dimensions_scored == len(available)

    if len(available) >= 3:
        expected = round(
            sum(d.weight * d.score for d in available)
            / sum(d.weight for d in available),
            1,
        )
        assert report.overall.score == expected


def test_overall_none_when_too_little_evidence(tmp_path):
    report = build_report(make_job(tmp_path))

    assert report.overall.score is None
    assert report.overall.dimensions_scored < 3


def test_malformed_required_artifact(tmp_path):
    (tmp_path / "words.json").write_text("{not-json", encoding="utf-8")

    with pytest.raises(ReportBuildError) as exc:
        build_report(tmp_path)

    assert exc.value.code == "ARTIFACT_INVALID"


def test_missing_required_artifact(tmp_path):
    with pytest.raises(ReportBuildError) as exc:
        build_report(tmp_path)

    assert exc.value.code == "MISSING_REQUIRED"


def test_no_speech(tmp_path):
    write(
        tmp_path / "words.json",
        {"language": "en", "duration_s": 10, "words": [], "segments": []},
    )

    with pytest.raises(ReportBuildError) as exc:
        build_report(tmp_path)

    assert exc.value.code == "NO_SPEECH_DETECTED"


def test_malformed_optional_artifact_warns(tmp_path):
    job = make_job(tmp_path)
    (job / "visual_features.json").write_text("{bad", encoding="utf-8")

    report = build_report(job)

    assert any(
        warning.code == "ARTIFACT_INVALID"
        for warning in report.meta.quality.warnings
    )


def test_extended_silence_is_excluded_automatically(tmp_path):
    words = block(0.2, 40, step=0.2)
    words += block(30.0, 40, step=0.2)
    job = make_job(tmp_path, words=words, duration=60)

    report = build_report(job)

    assert any(
        warning.code == "EXCLUDED_SILENCE"
        for warning in report.meta.quality.warnings
    )


def test_manual_annotation_is_optional_fixture(tmp_path):
    words = block(0.2, 40, step=0.2)
    words += block(10.0, 40, step=0.2)
    job = make_job(tmp_path, words=words, duration=30)

    annotations = tmp_path / "annotations.json"
    write(
        annotations,
        {
            "annotations": [
                {
                    "type": "speaker_transition",
                    "t0": 8.0,
                    "t1": 10.0,
                    "reviewed_manually": True,
                }
            ]
        },
    )

    report = build_report(job, annotations_path=annotations)
    assert report is not None


def test_partial_trailing_window_unavailable(tmp_path):
    words = block(0.2, 30, step=0.2)
    job = make_job(tmp_path, words=words, duration=12)

    report = build_report(job)

    trailing = [window for window in report.windows if window.t0 >= 10]
    assert trailing

    assert any(
        window.scores["speaking_rate"].score is None
        for window in trailing
    )


def test_deterministic(tmp_path):
    job = make_job(tmp_path, full=True)

    first = build_report(job, write=False)
    second = build_report(job, write=False)

    # Analysis time naturally changes between report generations.
    # Normalize it so the comparison checks the actual report contents.
    first.meta.analysed_at = second.meta.analysed_at

    assert first == second
