import { MethodologyData, MethodologyResponse } from '../lib/types/report';

export const DEFAULT_METHODOLOGY: MethodologyData = {
  weights: {
    speaking_rate: 0.18,
    vocal_expressiveness: 0.20,
    pausing_fluency: 0.20,
    gestures: 0.14,
    posture: 0.13,
    visual_engagement: 0.15,
  },
  bands: {
    speaking_rate: [90, 130, 175, 215],
    vocal_pitch: [0.8, 2.0, 6.0, 10.0],
    vocal_intensity: [2, 4, 9, 13],
    pause_ratio: [0.02, 0.08, 0.25, 0.45],
    fillers_per_min: [2, 12],
    gestures: [0.05, 0.25, 1.5, 3.0],
    posture_sway: [0.08, 0.35],
    posture_tilt: [5, 15],
    posture_slump: [0.05, 0.25],
    facing_fraction: [0.20, 0.65],
    head_activity: [25, 90],
  },
  reference:
    'Audio ranges are checked against a sample of polished TED-style speech; visual thresholds are design-based, not derived from a reference population.',
  disclaimer:
    'StageSense reports indicators of delivery, not grades or personality judgments. Results describe delivery patterns in this recording.',
};

export const DEFAULT_METHODOLOGY_RESPONSE: MethodologyResponse = {
  weights: DEFAULT_METHODOLOGY.weights,
  bands: DEFAULT_METHODOLOGY.bands,
  thresholds: {
    severe: 35,
    weak: 60,
    strong: 85,
  },
  reference: DEFAULT_METHODOLOGY.reference,
  disclaimer: DEFAULT_METHODOLOGY.disclaimer,
  pipeline_version: 'v1.0.4-prod',
  asr_model: 'whisper-large-v3-turbo / wav2vec2-pitch',
};
