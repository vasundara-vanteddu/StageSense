export const FOUR_CUES = [
  {
    id: 'listening',
    name: 'Listening',
    summary: 'Transcribes your speech and measures pace, pauses, pitch and volume.',
    inputs: 'Raw 44.1kHz audio stream extracted from container',
    outputs: 'Timestamped phoneme boundaries, fundamental frequency F0 contour, RMS dB level',
    tool: 'Pretrained acoustic speech recognition & DSP signal processing',
  },
  {
    id: 'watching',
    name: 'Watching',
    summary: 'Tracks posture, hand movement and head orientation.',
    inputs: 'Decompressed video frames at native capture framerate',
    outputs: '2D/3D skeletal landmark coordinates, head pose yaw/pitch/roll vectors',
    tool: 'Pretrained computer vision landmark pose models',
  },
  {
    id: 'aligning',
    name: 'Aligning',
    summary: 'Places everything on one timeline in 10-second windows.',
    inputs: 'Parallel audio and visual signal streams',
    outputs: 'Synchronized 10-second windows advancing with a 5-second hop',
    tool: 'Deterministic window aggregation & alignment matrix',
  },
  {
    id: 'writing',
    name: 'Writing',
    summary: 'Finds the moments that stand out and drafts feedback you can act on.',
    inputs: 'Window state sequences and compound event merges',
    outputs: 'Timestamped weak/severe/strong moments and rehearsal tips',
    tool: 'Deterministic pattern rules and structured feedback templates',
  },
];

export const HONESTY_POINTS = [
  {
    title: 'Indicators, not verdicts.',
    body: 'Scores describe delivery patterns in this recording. They say nothing about your intelligence, personality, or character as a speaker or person.',
  },
  {
    title: "What it doesn't do.",
    body: 'StageSense does not read emotion, confidence, or intent, and it is not eye tracking. Visual Engagement is strictly a head-orientation proxy for facing the camera.',
  },
  {
    title: 'Every formula is open.',
    body: 'Weights, thresholds, and scoring curves are published on the methodology page. No generative model writes your feedback; every tip is mapped directly to measured signals.',
    link: '/methodology',
    linkText: 'Read the methodology →',
  },
];
