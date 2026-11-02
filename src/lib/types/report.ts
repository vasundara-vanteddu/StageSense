// Replace with generated types from npm run gen:api when the backend is running.

export type DimensionKey =
  | 'speaking_rate'
  | 'vocal_expressiveness'
  | 'pausing_fluency'
  | 'gestures'
  | 'posture'
  | 'visual_engagement';

export type WindowState = 'severe' | 'weak' | 'normal' | 'strong';

export type Band = 'Strong' | 'Solid' | 'Developing' | 'Needs work';

export interface QualityWarning {
  code: 'CAMERA_ANGLE' | 'HANDS_NOT_VISIBLE' | 'SHOULDERS_NOT_VISIBLE' | 'VISUAL_LOW_QUALITY' | string;
  message: string;
}

export interface ReportMeta {
  filename: string;
  duration_s: number;
  language: string;
  window_s: 10;
  hop_s: 5;
  n_windows: number;
  pipeline_version: string;
  asr_model: string;
  analysed_at: string;
  quality: {
    speech_words: number;
    visual_valid_fraction: number;
    warnings: QualityWarning[];
  };
}

export interface OverallReport {
  score: number;
  band: Band;
  summary: string;
}

export interface HeadlineMetric {
  name: string;
  value: number;
  unit: string;
  target_low: number;
  target_high: number;
}

export interface DimensionSummary {
  key: DimensionKey;
  label: string;
  weight: number;
  available: boolean;
  score: number | null;
  band: Band | null;
  pct_windows_ok: number;
  headline_metric: HeadlineMetric;
  explanation: string;
  how_calculated: {
    windows_scored: number;
    formula: string;
    reference: string;
  };
}

export interface WindowMetrics {
  wpm: number | null;
  pitch_sd_st: number | null;
  intensity_sd_db: number | null;
  pause_ratio: number | null;
  fillers_per_min: number | null;
  gesture_activity: number | null;
  sway: number | null;
  facing_fraction: number | null;
}

export interface WindowData {
  i: number;
  t0: number;
  t1: number;
  composite: number;
  scores: Record<DimensionKey, number | null>;
  states: Record<DimensionKey, WindowState | null>;
  metrics: WindowMetrics;
}

export type EventSubtype =
  | 'pace_fast'
  | 'pace_slow'
  | 'flat_pitch'
  | 'flat_volume'
  | 'erratic_delivery'
  | 'pause_few'
  | 'pause_excess'
  | 'pause_long'
  | 'filler_heavy'
  | 'gesture_static'
  | 'gesture_excess'
  | 'posture_sway'
  | 'posture_tilt'
  | 'posture_slump'
  | 'looking_away'
  | 'head_motion'
  | 'strong';

export type CompoundKey =
  | 'rushed_and_static'
  | 'low_energy'
  | 'lost_thread'
  | 'breathless_rush';

export interface EventItem {
  id: string;
  kind: 'weak' | 'strong';
  dimension: DimensionKey | 'composite';
  subtype: EventSubtype;
  severity: 'weak' | 'severe' | 'strong';
  t0: number;
  t1: number;
  mean_score: number;
  impact: string;
  compound: CompoundKey | string | null;
  metric: {
    name: string;
    value: number;
  } | null;
  relative_shift: {
    z: number;
  } | null;
}

export interface TopImprovement {
  rank: number;
  dimension: DimensionKey;
  title: string;
  body: string;
  event_ids: string[];
  t0: number;
}

export interface StrengthItem {
  event_id: string;
  title: string;
  body: string;
  t0: number;
  t1: number;
}

export interface TimelineFeedbackItem {
  event_id: string;
  t0: number;
  t1: number;
  title: string;
  body: string;
  tip: string;
}

export interface FeedbackData {
  top_improvements: TopImprovement[];
  strengths: StrengthItem[];
  timeline_items: TimelineFeedbackItem[];
}

export interface TranscriptSegment {
  t0: number;
  t1: number;
  text: string;
}

export interface MethodologyData {
  weights: Record<DimensionKey, number>;
  bands: {
    speaking_rate: [number, number, number, number];
    vocal_pitch: [number, number, number, number];
    vocal_intensity: [number, number, number, number];
    pause_ratio: [number, number, number, number];
    fillers_per_min: [number, number];
    gestures: [number, number, number, number];
    posture_sway: [number, number];
    posture_tilt: [number, number];
    posture_slump: [number, number];
    facing_fraction: [number, number];
    head_activity: [number, number];
  };
  reference: string;
  disclaimer: string;
}

export interface Report {
  schema_version: '1.0';
  job_id: string;
  meta: ReportMeta;
  overall: OverallReport;
  dimensions: DimensionSummary[];
  windows: WindowData[];
  events: EventItem[];
  feedback: FeedbackData;
  transcript: {
    segments: TranscriptSegment[];
  };
  methodology: MethodologyData;
}

export type JobStatusType =
  | 'uploaded'
  | 'processing'
  | 'completed'
  | 'queued'
  | 'preprocessing'
  | 'transcribing'
  | 'analysing_visual'
  | 'aligning'
  | 'scoring'
  | 'writing'
  | 'done'
  | 'failed';

export interface JobStage {
  id: 'listening' | 'watching' | 'aligning' | 'writing';
  label: string;
  state: 'waiting' | 'active' | 'done' | 'failed';
}

export interface JobError {
  code: string;
  message: string;
  hint: string;
}

export interface JobStatus {
  job_id: string;
  status: JobStatusType;
  stage: string;
  progress: number; // 0 to 1
  stages: JobStage[];
  error: JobError | null;
  duration_s: number;
  created_at: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    hint: string;
  };
}

export interface MethodologyResponse {
  weights: Record<DimensionKey, number>;
  bands: MethodologyData['bands'];
  thresholds: {
    severe: number;
    weak: number;
    strong: number;
  };
  reference: string;
  disclaimer: string;
  pipeline_version: string;
  asr_model: string;
}
