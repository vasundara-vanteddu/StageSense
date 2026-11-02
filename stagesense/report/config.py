"""Thresholds, weights and defaults for report building (project heuristics, not validated norms)."""
from __future__ import annotations

from dataclasses import dataclass

DIMENSIONS = ("speaking_rate", "vocal_expressiveness", "pausing_fluency",
              "gestures", "posture", "visual_engagement")
LABELS = {
    "speaking_rate": "Speaking Rate", "vocal_expressiveness": "Vocal Expressiveness",
    "pausing_fluency": "Pausing & Fluency", "gestures": "Gestures",
    "posture": "Posture", "visual_engagement": "Visual Engagement",
}
WEIGHTS = {"speaking_rate": 0.18, "vocal_expressiveness": 0.20, "pausing_fluency": 0.20,
           "gestures": 0.14, "posture": 0.13, "visual_engagement": 0.15}
VISUAL_REASON = "Head-orientation analysis is not implemented in this pipeline version."


@dataclass(frozen=True)
class BuildConfig:
    pipeline_version: str = "0.1.0"
    asr_model: str = "faster-whisper small.en (int8, CPU)"
    window_s: float = 10.0
    hop_s: float = 5.0
    # speech metrics
    min_words_total: int = 30
    min_words_window: int = 5
    min_effective_s: float = 5.0
    pause_min_s: float = 0.4
    long_pause_s: float = 0.7
    exclude_gap_s: float = 5.0
    # mirrors the scorers' default parameters (keep in sync with scoring modules)
    wpm_target: tuple[float, float] = (120.0, 160.0)
    max_pause_ratio: float = 0.1
    min_pitch_variation_hz: float = 10.0
    posture_tolerance_deg: float = 10.0
    gesture_reference: float = 0.05
    # aggregation
    min_scored_windows: int = 3
    min_coverage: float = 0.2
    min_dimensions_for_overall: int = 3
    severe_below: float = 35.0
    weak_below: float = 60.0
    strong_from: float = 85.0
    ok_from: float = 60.0
    # events
    event_min_duration_s: float = 15.0
    event_bridge_below: float = 70.0
    strong_min_windows: int = 3
    max_weak_events: int = 5
    max_weak_per_dimension: int = 2
    max_strong_events: int = 3
    # quality
    asr_conf_warn: float = 0.7
    visual_valid_warn: float = 0.5

    def state_for(self, score):
        if score is None:
            return None
        if score < self.severe_below:
            return "severe"
        if score < self.weak_below:
            return "weak"
        if score >= self.strong_from:
            return "strong"
        return "normal"

    @staticmethod
    def band_for(score):
        if score is None:
            return None
        if score >= 85:
            return "Strong"
        if score >= 70:
            return "Solid"
        if score >= 55:
            return "Developing"
        return "Needs work"