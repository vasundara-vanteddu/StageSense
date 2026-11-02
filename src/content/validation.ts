export interface ValidationCheck {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'published';
  result: string | null;
  targetMetric?: string;
}

export const VALIDATION_CHECKS: ValidationCheck[] = [
  {
    id: 'synthetic_audio',
    title: 'Synthetic audio perturbation tests',
    description: 'Controlled acoustic stress testing with calibrated white noise, pink noise, and reverberant room impulses.',
    status: 'planned',
    result: null,
    targetMetric: 'SNR tolerance threshold (dB)',
  },
  {
    id: 'speech_timing',
    title: 'Speech-timing validation against reference transcripts',
    description: 'Frame-level alignment comparison between StageSense acoustic boundaries and forced phoneme alignments.',
    status: 'planned',
    result: null,
    targetMetric: 'Boundary delta mean absolute error (ms)',
  },
  {
    id: 'visual_robustness',
    title: 'Visual robustness tests',
    description: 'Systematic testing across low lux conditions, partial occlusions, rapid head turns, and varying camera focal lengths.',
    status: 'planned',
    result: null,
    targetMetric: 'Pose estimation stability across angles',
  },
  {
    id: 'injected_moment',
    title: 'Injected-moment detection tests',
    description: 'Benchmarking window detection recall on synthetic presentation video recordings with deliberately inserted pauses and pace spikes.',
    status: 'planned',
    result: null,
    targetMetric: 'Precision/Recall at hop boundary',
  },
  {
    id: 'face_validity',
    title: 'Face-validity review',
    description: 'Structured double-blind qualitative review by university presentation instructors evaluating indicator utility.',
    status: 'planned',
    result: null,
    targetMetric: 'Inter-rater concordance (Krippendorff alpha)',
  },
];

export const VALIDATION_DISCLAIMER =
  'Human-rated validation has not been completed. StageSense reports heuristic delivery indicators against calibrated technical references, not psychological truth or human evaluator judgments.';
