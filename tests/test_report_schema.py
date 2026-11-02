
import pytest
from pydantic import ValidationError

from stagesense.report.schema import (
    DIMENSION_KEYS,
    DimensionReport,
    Event,
    Feedback,
    HowCalculated,
    Meta,
    Methodology,
    Overall,
    Report,
    TimelineItem,
    WindowReport,
    WindowScore,
    load_report,
    save_report,
)


def make_report(feedback=None):
    dims = [
        DimensionReport(
            key=k,
            label=k.replace("_", " ").title(),
            weight=1 / 6,
            available=k != "visual_engagement",
            unavailable_reason=(
                None if k != "visual_engagement"
                else "No head-orientation module yet"
            ),
            score=70.0 if k != "visual_engagement" else None,
            band="Solid" if k != "visual_engagement" else None,
            how_calculated=HowCalculated(
                windows_scored=1,
                formula="test",
                reference="test",
            ),
        )
        for k in DIMENSION_KEYS
    ]

    window = WindowReport(
        i=0,
        t0=0.0,
        t1=10.0,
        scores={
            k: WindowScore(score=None, status="unavailable")
            for k in DIMENSION_KEYS
        },
        states={k: None for k in DIMENSION_KEYS},
        metrics={
            "pitch_std_hz": None,
            "mean_wrist_displacement": 0.0123,
        },
    )

    event = Event(
        id="e1",
        kind="weak",
        dimension="gestures",
        subtype="gesture_static",
        severity="weak",
        t0=0.0,
        t1=10.0,
    )

    return Report(
        job_id="t",
        meta=Meta(
            filename="x.mp4",
            duration_s=10.0,
            language="en",
            n_windows=1,
            pipeline_version="0.1.0",
        ),
        overall=Overall(
            score=70.0,
            band="Solid",
            dimensions_scored=5,
        ),
        dimensions=dims,
        windows=[window],
        events=[event],
        feedback=feedback or Feedback(),
        methodology=Methodology(
            weights={k: 1 / 6 for k in DIMENSION_KEYS},
            reference="test",
        ),
    )


def test_roundtrip(tmp_path):
    report = make_report()
    path = save_report(report, tmp_path / "report.json")
    assert load_report(path) == report


def test_available_dimension_needs_score():
    with pytest.raises(ValidationError):
        DimensionReport(
            key="posture",
            label="Posture",
            weight=0.1,
            available=True,
            how_calculated=HowCalculated(
                windows_scored=0,
                formula="",
                reference="",
            ),
        )


def test_unknown_event_reference_rejected():
    bad = Feedback(
        timeline_items=[
            TimelineItem(
                event_id="nope",
                t0=0,
                t1=1,
                title="t",
                body="b",
            )
        ]
    )

    with pytest.raises(ValidationError):
        make_report(feedback=bad)
