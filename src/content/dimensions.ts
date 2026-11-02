import { DimensionKey } from '../lib/types/report';

export interface DimensionInfo {
  key: DimensionKey;
  index: string;
  name: string;
  shortLabel: string;
  oneLiner: string;
  measures: string;
  doesNotMeasure: string;
  whatIsMeasured: string;
  howCalculated: string;
  lowReadingMeaning: string;
  highReadingMeaning: string;
  limits: string;
}

export const DIMENSIONS_CONTENT: Record<DimensionKey, DimensionInfo> = {
  speaking_rate: {
    key: 'speaking_rate',
    index: '01',
    name: 'Speaking Rate',
    shortLabel: 'Pace',
    oneLiner: 'How fast you speak, window by window.',
    measures: 'Words per minute inside each 10-second window.',
    doesNotMeasure: 'Whether the content is clear or easy to understand.',
    whatIsMeasured: 'Pace is evaluated from transcript word timestamps inside each 10-second sliding window.',
    howCalculated: 'Scored 100 inside the polished baseline range of 130–175 wpm. Scores fall toward 0 below 90 wpm and above 215 wpm.',
    lowReadingMeaning: 'Unusually slow stretches where momentum may drop or hesitations dominate.',
    highReadingMeaning: 'Rushed stretches where complex ideas might run ahead of audience absorption.',
    limits: 'Depends on transcription accuracy. Rapid, accented, or reverberant speech can cause minor miscounts.',
  },
  vocal_expressiveness: {
    key: 'vocal_expressiveness',
    index: '02',
    name: 'Vocal Expressiveness',
    shortLabel: 'Voice',
    oneLiner: 'How much your pitch and volume move.',
    measures: 'Variation in fundamental frequency (semitones) and root-mean-square loudness.',
    doesNotMeasure: 'Absolute volume, vocal pleasantness, or emotional sincerity.',
    whatIsMeasured: 'Standard deviation of pitch contour in semitones and dynamic envelope variance across each analysis window.',
    howCalculated: 'Evaluates dynamic pitch variation (target 2.0–6.0 semitones SD) and vocal intensity inflection (4–9 dB SD). Absolute loudness is never evaluated.',
    lowReadingMeaning: 'Monotone or flat delivery that can feel disengaged or low energy.',
    highReadingMeaning: 'High dynamic vocal inflections, typical of animated or theatrical delivery.',
    limits: 'Microphone frequency response, distance from mic, and acoustic reverberation affect contour extraction.',
  },
  pausing_fluency: {
    key: 'pausing_fluency',
    index: '03',
    name: 'Pausing & Fluency',
    shortLabel: 'Pauses',
    oneLiner: 'Where you pause, and where filler words creep in.',
    measures: 'Ratio of pause intervals (≥0.4s), frequency of long pauses (≥3s), and filler rate.',
    doesNotMeasure: 'Whether a pause was intentional, dramatic, or thoughtful.',
    whatIsMeasured: 'Silence durations between utterance segments, speech-to-pause ratio, and detected disfluency markers (um, uh, you know, etc.).',
    howCalculated: 'Optimal pause ratio sits between 8% and 25% of window duration. Disfluencies are penalised when exceeding 2 per minute.',
    lowReadingMeaning: 'Breathless delivery with insufficient pauses for the listener to digest ideas.',
    highReadingMeaning: 'Frequent or lengthy pauses, or elevated presence of filler vocalizations.',
    limits: 'Filler counts are lower bounds because ASR models frequently normalize or elide subtle fillers. Deliberate rhetorical pauses cannot be distinguished automatically from forgotten lines.',
  },
  gestures: {
    key: 'gestures',
    index: '04',
    name: 'Gestures',
    shortLabel: 'Hands',
    oneLiner: 'How much your hands move while you speak.',
    measures: 'Wrist velocity and displacement relative to shoulder width while hands are visible.',
    doesNotMeasure: 'Whether a gesture is natural, descriptive, or rhetorically effective.',
    whatIsMeasured: '2D spatial landmark tracking of wrist keypoints normalized by the speaker’s inter-shoulder distance.',
    howCalculated: 'Evaluated when hands are elevated into frame. Target gesture activity sits in 0.25–1.50 activity units.',
    lowReadingMeaning: 'Still hands held at the sides or podium, reducing physical variety.',
    highReadingMeaning: 'Continuous, rapid, or busy hand movements that can distract from the verbal message.',
    limits: 'Requires hands to remain within the camera frame. If hands drop below the frame, the dimension cannot be scored.',
  },
  posture: {
    key: 'posture',
    index: '05',
    name: 'Posture',
    shortLabel: 'Posture',
    oneLiner: 'How steady and aligned you hold yourself.',
    measures: 'Shoulder-line tilt, horizontal lateral sway, and slump against your own upright baseline.',
    doesNotMeasure: 'Physical ergonomics, comfort, or spine health.',
    whatIsMeasured: 'Torso alignment angles, vertical slump ratio, and lateral oscillation frequency in the 2D plane.',
    howCalculated: 'Computed relative to your own median upright frame. Penalty accumulates for sustained tilts >5° or repetitive rocking.',
    lowReadingMeaning: 'Noticeable side-to-side sway, asymmetric leaning, or progressive slouching.',
    highReadingMeaning: 'Grounded, stable, and upright physical poise throughout the section.',
    limits: '2D optical projection is sensitive to camera placement angle, height, and tripod vibration. Not an ergonomic assessment.',
  },
  visual_engagement: {
    key: 'visual_engagement',
    index: '06',
    name: 'Visual Engagement',
    shortLabel: 'Focus',
    oneLiner: 'How often you face the camera, a head-orientation proxy.',
    measures: 'Fraction of time head pose faces the lens (within 20° of median baseline) and head steadiness.',
    doesNotMeasure: 'Gaze direction, true eye contact with people, or attentiveness.',
    whatIsMeasured: '3D facial pose estimation estimating pitch, yaw, and roll relative to the camera lens axis.',
    howCalculated: 'Measures the proportion of each window where head vector is within 20° cone of the lens orientation.',
    lowReadingMeaning: 'Extended periods looking away toward slides, floor, or notes.',
    highReadingMeaning: 'Consistent head orientation directed toward the audience lens.',
    limits: 'Visual Engagement is strictly a head-orientation / camera-facing proxy. It is NOT eye tracking and does NOT measure true audience eye contact or cognitive connection.',
  },
};
