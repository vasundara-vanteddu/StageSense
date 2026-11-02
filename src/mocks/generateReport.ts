import {
  Band,
  DimensionKey,
  DimensionSummary,
  EventItem,
  FeedbackData,
  QualityWarning,
  Report,
  WindowData,
  WindowState,
} from '../lib/types/report';
import { DEFAULT_METHODOLOGY } from './methodology';

export function calculateTrapezoidScore(val: number, [a, b, c, d]: [number, number, number, number]): number {
  if (val <= a) return 0;
  if (val >= d) return 0;
  if (val >= b && val <= c) return 100;
  if (val < b) return Math.round(((val - a) / (b - a)) * 100);
  return Math.round(((d - val) / (d - c)) * 100);
}

export function calculateLowerIsBetterScore(val: number, [target, max]: [number, number]): number {
  if (val <= target) return 100;
  if (val >= max) return 0;
  return Math.round(((max - val) / (max - target)) * 100);
}

export function calculateHigherIsBetterScore(val: number, [min, target]: [number, number]): number {
  if (val >= target) return 100;
  if (val <= min) return 0;
  return Math.round(((val - min) / (target - min)) * 100);
}

export function getScoreState(score: number | null): WindowState | null {
  if (score === null) return null;
  if (score < 35) return 'severe';
  if (score < 60) return 'weak';
  if (score < 85) return 'normal';
  return 'strong';
}

export function getBand(score: number): Band {
  if (score >= 85) return 'Strong';
  if (score >= 70) return 'Solid';
  if (score >= 55) return 'Developing';
  return 'Needs work';
}

export interface ScriptedReportConfig {
  jobId: string;
  filename: string;
  duration_s: number;
  availableDimensions?: Record<DimensionKey, boolean>;
  warnings?: QualityWarning[];
  baseMetrics?: {
    wpm?: number;
    pitch_sd_st?: number;
    intensity_sd_db?: number;
    pause_ratio?: number;
    fillers_per_min?: number;
    gesture_activity?: number;
    sway?: number;
    facing_fraction?: number;
  };
  eventsScript: EventItem[];
  feedbackScript: FeedbackData;
  transcriptScript: { t0: number; t1: number; text: string }[];
  overallSummary: string;
}

export function generateScriptedReport(config: ScriptedReportConfig): Report {
  const {
    jobId,
    filename,
    duration_s,
    availableDimensions = {
      speaking_rate: true,
      vocal_expressiveness: true,
      pausing_fluency: true,
      gestures: true,
      posture: true,
      visual_engagement: true,
    },
    warnings = [],
    eventsScript,
    feedbackScript,
    transcriptScript,
    overallSummary,
  } = config;

  // Window calculation: 10s windows with 5s hop
  const n_windows = Math.floor((duration_s - 10) / 5) + 1;
  const windows: WindowData[] = [];

  const base = {
    wpm: 152,
    pitch_sd_st: 3.4,
    intensity_sd_db: 6.2,
    pause_ratio: 0.14,
    fillers_per_min: 1.5,
    gesture_activity: 0.85,
    sway: 0.12,
    facing_fraction: 0.78,
    ...config.baseMetrics,
  };

  for (let i = 0; i < n_windows; i++) {
    const t0 = i * 5;
    const t1 = t0 + 10;
    const mid = (t0 + t1) / 2;

    // Small deterministic pseudo-noise based on i
    const noise = Math.sin(i * 1.7) * 0.15;
    const noise2 = Math.cos(i * 2.3) * 0.12;

    let wpm = Math.round(base.wpm + noise * 18);
    let pitch_sd_st = Number((base.pitch_sd_st + noise2 * 0.8).toFixed(2));
    let intensity_sd_db = Number((base.intensity_sd_db + noise * 1.2).toFixed(2));
    let pause_ratio = Number(Math.max(0.01, Math.min(0.4, base.pause_ratio + noise * 0.05)).toFixed(3));
    let fillers_per_min = Math.max(0, Number((base.fillers_per_min + (i % 7 === 0 ? 3 : 0)).toFixed(1)));
    let gesture_activity = Number(Math.max(0, base.gesture_activity + noise2 * 0.35).toFixed(2));
    let sway = Number(Math.max(0.05, base.sway + Math.abs(noise) * 0.15).toFixed(3));
    let facing_fraction = Number(Math.min(1.0, Math.max(0.1, base.facing_fraction + noise2 * 0.15)).toFixed(2));

    // Modulate based on events covering this time
    for (const ev of eventsScript) {
      if (mid >= ev.t0 && mid <= ev.t1) {
        if (ev.subtype === 'pace_fast') {
          wpm = 196 + Math.round(Math.sin(i) * 6);
        } else if (ev.subtype === 'pace_slow') {
          wpm = 104 - Math.round(Math.sin(i) * 5);
        } else if (ev.subtype === 'flat_pitch') {
          pitch_sd_st = 1.1;
        } else if (ev.subtype === 'flat_volume') {
          intensity_sd_db = 2.4;
        } else if (ev.subtype === 'pause_long') {
          pause_ratio = 0.38;
        } else if (ev.subtype === 'filler_heavy') {
          fillers_per_min = 9.2;
        } else if (ev.subtype === 'gesture_static') {
          gesture_activity = 0.08;
        } else if (ev.subtype === 'gesture_excess') {
          gesture_activity = 2.4;
        } else if (ev.subtype === 'posture_sway') {
          sway = 0.32;
        } else if (ev.subtype === 'looking_away') {
          facing_fraction = 0.32;
        } else if (ev.subtype === 'strong') {
          wpm = 155;
          pitch_sd_st = 4.2;
          gesture_activity = 1.1;
          facing_fraction = 0.92;
        }
      }
    }

    // Compute scores for each dimension in this window
    const scores: Record<DimensionKey, number | null> = {
      speaking_rate: availableDimensions.speaking_rate
        ? calculateTrapezoidScore(wpm, DEFAULT_METHODOLOGY.bands.speaking_rate)
        : null,
      vocal_expressiveness: availableDimensions.vocal_expressiveness
        ? Math.round(
            (calculateTrapezoidScore(pitch_sd_st, DEFAULT_METHODOLOGY.bands.vocal_pitch) +
              calculateTrapezoidScore(intensity_sd_db, DEFAULT_METHODOLOGY.bands.vocal_intensity)) /
              2
          )
        : null,
      pausing_fluency: availableDimensions.pausing_fluency
        ? Math.round(
            calculateTrapezoidScore(pause_ratio, DEFAULT_METHODOLOGY.bands.pause_ratio) * 0.7 +
              calculateLowerIsBetterScore(fillers_per_min, DEFAULT_METHODOLOGY.bands.fillers_per_min) * 0.3
          )
        : null,
      gestures: availableDimensions.gestures
        ? calculateTrapezoidScore(gesture_activity, DEFAULT_METHODOLOGY.bands.gestures)
        : null,
      posture: availableDimensions.posture
        ? calculateLowerIsBetterScore(sway, DEFAULT_METHODOLOGY.bands.posture_sway)
        : null,
      visual_engagement: availableDimensions.visual_engagement
        ? calculateHigherIsBetterScore(facing_fraction, DEFAULT_METHODOLOGY.bands.facing_fraction)
        : null,
    };

    const states: Record<DimensionKey, WindowState | null> = {
      speaking_rate: getScoreState(scores.speaking_rate),
      vocal_expressiveness: getScoreState(scores.vocal_expressiveness),
      pausing_fluency: getScoreState(scores.pausing_fluency),
      gestures: getScoreState(scores.gestures),
      posture: getScoreState(scores.posture),
      visual_engagement: getScoreState(scores.visual_engagement),
    };

    // Composite score for this window
    let weightedSum = 0;
    let activeWeight = 0;
    const keys: DimensionKey[] = [
      'speaking_rate',
      'vocal_expressiveness',
      'pausing_fluency',
      'gestures',
      'posture',
      'visual_engagement',
    ];

    for (const key of keys) {
      if (availableDimensions[key] && scores[key] !== null) {
        const w = DEFAULT_METHODOLOGY.weights[key];
        weightedSum += (scores[key] as number) * w;
        activeWeight += w;
      }
    }

    const composite = activeWeight > 0 ? Math.round(weightedSum / activeWeight) : 70;

    windows.push({
      i,
      t0,
      t1,
      composite,
      scores,
      states,
      metrics: {
        wpm: availableDimensions.speaking_rate ? wpm : null,
        pitch_sd_st: availableDimensions.vocal_expressiveness ? pitch_sd_st : null,
        intensity_sd_db: availableDimensions.vocal_expressiveness ? intensity_sd_db : null,
        pause_ratio: availableDimensions.pausing_fluency ? pause_ratio : null,
        fillers_per_min: availableDimensions.pausing_fluency ? fillers_per_min : null,
        gesture_activity: availableDimensions.gestures ? gesture_activity : null,
        sway: availableDimensions.posture ? sway : null,
        facing_fraction: availableDimensions.visual_engagement ? facing_fraction : null,
      },
    });
  }

  // Dimension summaries
  const dimensionKeys: DimensionKey[] = [
    'speaking_rate',
    'vocal_expressiveness',
    'pausing_fluency',
    'gestures',
    'posture',
    'visual_engagement',
  ];

  const dimensions: DimensionSummary[] = dimensionKeys.map((key) => {
    const isAvail = availableDimensions[key];
    if (!isAvail) {
      return {
        key,
        label: key === 'gestures' ? 'Gestures' : key.replace(/_/g, ' '),
        weight: DEFAULT_METHODOLOGY.weights[key],
        available: false,
        score: null,
        band: null,
        pct_windows_ok: 0,
        headline_metric: {
          name: 'Activity',
          value: 0,
          unit: 'units',
          target_low: 0.25,
          target_high: 1.5,
        },
        explanation: 'Hands were not consistently visible in frame throughout the recording.',
        how_calculated: {
          windows_scored: 0,
          formula: 'Dimension excluded due to insufficient camera frame visibility.',
          reference: 'MediaPipe Hands confidence threshold >= 0.65',
        },
      };
    }

    const validScores = windows.map((w) => w.scores[key]).filter((s): s is number => s !== null);
    const meanScore = validScores.length > 0 ? validScores.reduce((a, b) => a + b, 0) / validScores.length : 70;
    const okCount = validScores.filter((s) => s >= 60).length;
    const pctOk = validScores.length > 0 ? Math.round((okCount / validScores.length) * 100) : 100;
    const finalScore = Math.round(0.75 * meanScore + 0.25 * pctOk);

    // Headline metrics
    let headlineMetric = {
      name: 'Words per minute',
      value: Math.round(
        windows.reduce((acc, w) => acc + (w.metrics.wpm || base.wpm), 0) / windows.length
      ),
      unit: 'wpm',
      target_low: 130,
      target_high: 175,
    };

    let formula = '0.75 × mean_window_score + 0.25 × (% windows ≥ 60)';
    let reference = 'TED polished presentation corpus (130–175 wpm)';

    if (key === 'vocal_expressiveness') {
      headlineMetric = {
        name: 'Pitch spread',
        value: Number(
          (
            windows.reduce((acc, w) => acc + (w.metrics.pitch_sd_st || base.pitch_sd_st), 0) /
            windows.length
          ).toFixed(1)
        ),
        unit: 'st',
        target_low: 2.0,
        target_high: 6.0,
      };
      reference = 'Wav2Vec2 pitch contour semitone standard deviation';
    } else if (key === 'pausing_fluency') {
      headlineMetric = {
        name: 'Pause ratio',
        value: Math.round(
          (windows.reduce((acc, w) => acc + (w.metrics.pause_ratio || base.pause_ratio), 0) /
            windows.length) *
            100
        ),
        unit: '%',
        target_low: 8,
        target_high: 25,
      };
      reference = 'Vocal pause detection threshold >= 0.40s silence';
    } else if (key === 'gestures') {
      headlineMetric = {
        name: 'Gesture activity',
        value: Number(
          (
            windows.reduce((acc, w) => acc + (w.metrics.gesture_activity || base.gesture_activity), 0) /
            windows.length
          ).toFixed(2)
        ),
        unit: 'units',
        target_low: 0.25,
        target_high: 1.5,
      };
      reference = 'Inter-wrist optical displacement relative to shoulder width';
    } else if (key === 'posture') {
      headlineMetric = {
        name: 'Shoulder stability',
        value: Number(
          (
            windows.reduce((acc, w) => acc + (w.metrics.sway || base.sway), 0) / windows.length
          ).toFixed(2)
        ),
        unit: 'sway',
        target_low: 0.08,
        target_high: 0.22,
      };
      reference = '2D lateral shoulder sway index relative to median baseline';
    } else if (key === 'visual_engagement') {
      headlineMetric = {
        name: 'Camera facing',
        value: Math.round(
          (windows.reduce((acc, w) => acc + (w.metrics.facing_fraction || base.facing_fraction), 0) /
            windows.length) *
            100
        ),
        unit: '%',
        target_low: 65,
        target_high: 100,
      };
      reference = 'Head orientation within ±20° lens cone proxy';
    }

    return {
      key,
      label: key === 'speaking_rate' ? 'Speaking Rate' : key === 'vocal_expressiveness' ? 'Vocal Expressiveness' : key === 'pausing_fluency' ? 'Pausing & Fluency' : key === 'gestures' ? 'Gestures' : key === 'posture' ? 'Posture' : 'Visual Engagement',
      weight: DEFAULT_METHODOLOGY.weights[key],
      available: true,
      score: finalScore,
      band: getBand(finalScore),
      pct_windows_ok: pctOk,
      headline_metric: headlineMetric,
      explanation: `Measures behavior across ${windows.length} ten-second windows.`,
      how_calculated: {
        windows_scored: windows.length,
        formula,
        reference,
      },
    };
  });

  // Calculate Overall
  let totalScoreWeight = 0;
  let activeDimWeight = 0;
  for (const d of dimensions) {
    if (d.available && d.score !== null) {
      totalScoreWeight += d.score * d.weight;
      activeDimWeight += d.weight;
    }
  }

  const overallScore = activeDimWeight > 0 ? Math.round(totalScoreWeight / activeDimWeight) : 70;

  return {
    schema_version: '1.0',
    job_id: jobId,
    meta: {
      filename,
      duration_s,
      language: 'en-US',
      window_s: 10,
      hop_s: 5,
      n_windows: windows.length,
      pipeline_version: 'v1.0.4-prod',
      asr_model: 'whisper-large-v3-turbo / pyannote / mediapipe',
      analysed_at: new Date().toISOString(),
      quality: {
        speech_words: Math.round((duration_s / 60) * base.wpm),
        visual_valid_fraction: availableDimensions.gestures ? 0.94 : 0.62,
        warnings,
      },
    },
    overall: {
      score: overallScore,
      band: getBand(overallScore),
      summary: overallSummary,
    },
    dimensions,
    windows,
    events: eventsScript,
    feedback: feedbackScript,
    transcript: {
      segments: transcriptScript,
    },
    methodology: DEFAULT_METHODOLOGY,
  };
}
