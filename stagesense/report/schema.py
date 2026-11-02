
"""StageSense report schema v1.0: the contract between pipeline, API and frontend."""
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal, get_args

from pydantic import BaseModel, ConfigDict, Field, model_validator

SCHEMA_VERSION = "1.0"

DimensionKey = Literal[
    "speaking_rate", "vocal_expressiveness", "pausing_fluency",
    "gestures", "posture", "visual_engagement",
]
DIMENSION_KEYS: tuple[str, ...] = get_args(DimensionKey)
WindowState = Literal["severe", "weak", "normal", "strong"]
Band = Literal["Strong", "Solid", "Developing", "Needs work"]
Severity = Literal["weak", "severe", "strong"]


class _Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ReportWarning(_Model):
    code: str
    message: str
    t0: float | None = None
    t1: float | None = None


class Quality(_Model):
    speech_words: int = 0
    asr_mean_confidence: float | None = None
    visual_valid_fraction: float | None = None
    warnings: list[ReportWarning] = Field(default_factory=list)


class Meta(_Model):
    filename: str
    duration_s: float = Field(gt=0)
    language: str
    window_s: float = 10.0
    hop_s: float = 5.0
    n_windows: int = Field(ge=0)
    pipeline_version: str
    asr_model: str | None = None
    visual_sampling_fps: float | None = None
    analysed_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    quality: Quality = Field(default_factory=Quality)


class Overall(_Model):
    score: float | None = None
    band: Band | None = None
    summary: str = ""
    dimensions_scored: int = Field(ge=0, le=6)


class HeadlineMetric(_Model):
    name: str
    value: float | None = None
    unit: str = ""
    target_low: float | None = None
    target_high: float | None = None


class HowCalculated(_Model):
    windows_scored: int = Field(ge=0)
    formula: str
    reference: str


class DimensionReport(_Model):
    key: DimensionKey
    label: str
    weight: float = Field(ge=0, le=1)
    available: bool
    unavailable_reason: str | None = None
    score: float | None = None
    band: Band | None = None
    pct_windows_ok: float | None = Field(default=None, ge=0, le=1)
    headline_metric: HeadlineMetric | None = None
    explanation: str = ""
    how_calculated: HowCalculated

    @model_validator(mode="after")
    def _availability(self):
        if self.available and self.score is None:
            raise ValueError(
                f"{self.key}: available dimension needs a score"
            )
        if not self.available and (
            self.score is not None or not self.unavailable_reason
        ):
            raise ValueError(
                f"{self.key}: unavailable dimension needs a reason and no score"
            )
        return self


class WindowScore(_Model):
    """Mirrors the existing scorer output: score, status, feedback text."""
    score: float | None = None
    status: str
    note: str | None = None


class WindowReport(_Model):
    i: int = Field(ge=0)
    t0: float
    t1: float
    composite: float | None = None
    scores: dict[DimensionKey, WindowScore]
    states: dict[DimensionKey, WindowState | None]
    metrics: dict[str, float | int | None] = Field(default_factory=dict)

    @model_validator(mode="after")
    def _ordered(self):
        if self.t1 <= self.t0:
            raise ValueError("window t1 must be after t0")
        return self


class EventMetric(_Model):
    name: str
    value: float | None = None
    unit: str = ""
    target_low: float | None = None
    target_high: float | None = None


class RelativeShift(_Model):
    z: float


class Event(_Model):
    id: str
    kind: Literal["weak", "strong"]
    dimension: DimensionKey | Literal["composite"]
    subtype: str
    severity: Severity
    t0: float
    t1: float
    mean_score: float | None = None
    impact: float | None = None
    compound: str | None = None
    metric: EventMetric | None = None
    relative_shift: RelativeShift | None = None

    @model_validator(mode="after")
    def _consistent(self):
        if self.t1 <= self.t0:
            raise ValueError(f"event {self.id}: t1 must be after t0")
        if (self.kind == "strong") != (self.severity == "strong"):
            raise ValueError(f"event {self.id}: kind and severity disagree")
        return self


class TopImprovement(_Model):
    rank: int = Field(ge=1, le=3)
    dimension: DimensionKey
    title: str
    body: str
    event_ids: list[str] = Field(default_factory=list)
    t0: float | None = None


class Strength(_Model):
    event_id: str | None = None
    title: str
    body: str
    t0: float | None = None
    t1: float | None = None


class TimelineItem(_Model):
    event_id: str
    t0: float
    t1: float
    title: str
    body: str
    tip: str | None = None


class Feedback(_Model):
    top_improvements: list[TopImprovement] = Field(default_factory=list)
    strengths: list[Strength] = Field(default_factory=list)
    timeline_items: list[TimelineItem] = Field(default_factory=list)


class TranscriptSegment(_Model):
    t0: float
    t1: float
    text: str


class Transcript(_Model):
    segments: list[TranscriptSegment] = Field(default_factory=list)


class Methodology(_Model):
    weights: dict[DimensionKey, float]
    bands: dict[str, list[float]] = Field(default_factory=dict)
    thresholds: dict[str, float] = Field(default_factory=dict)
    reference: str
    disclaimer: str = "Indicators of delivery, not grades."
    limitations: list[str] = Field(default_factory=list)


class Report(_Model):
    schema_version: Literal["1.0"] = SCHEMA_VERSION
    job_id: str
    meta: Meta
    overall: Overall
    dimensions: list[DimensionReport]
    windows: list[WindowReport]
    events: list[Event] = Field(default_factory=list)
    feedback: Feedback = Field(default_factory=Feedback)
    transcript: Transcript = Field(default_factory=Transcript)
    methodology: Methodology

    @model_validator(mode="after")
    def _consistency(self):
        if sorted(d.key for d in self.dimensions) != sorted(DIMENSION_KEYS):
            raise ValueError(
                "dimensions must contain each of the six keys exactly once"
            )

        ids = [e.id for e in self.events]
        if len(ids) != len(set(ids)):
            raise ValueError("event ids must be unique")

        refs = [i for t in self.feedback.top_improvements for i in t.event_ids]
        refs += [t.event_id for t in self.feedback.timeline_items]
        refs += [
            s.event_id for s in self.feedback.strengths if s.event_id
        ]

        missing = set(refs) - set(ids)
        if missing:
            raise ValueError(
                f"feedback references unknown events: {sorted(missing)}"
            )

        if len(self.windows) != self.meta.n_windows:
            raise ValueError("meta.n_windows must equal len(windows)")

        return self


def save_report(report: Report, path: str | Path) -> Path:
    dest = Path(path)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(report.model_dump_json(indent=2), encoding="utf-8")
    return dest


def load_report(path: str | Path) -> Report:
    return Report.model_validate_json(
        Path(path).read_text(encoding="utf-8")
    )
