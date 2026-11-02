export interface SubtypeMeta {
  label: string;
  whyItMatters: string;
}

export const SUBTYPES_CONTENT: Record<string, SubtypeMeta> = {
  pace_fast: {
    label: 'Pace picked up',
    whyItMatters: 'Accelerating past 190 words per minute makes complex technical points difficult for listeners to absorb in real time.',
  },
  pace_slow: {
    label: 'Pace slowed',
    whyItMatters: 'Extended drops below 110 words per minute risk audience disengagement unless paired with deliberate emphasis.',
  },
  flat_pitch: {
    label: 'Flat pitch',
    whyItMatters: 'A narrow pitch contour flattens vocal dynamics, making key points sound indistinguishable from background context.',
  },
  flat_volume: {
    label: 'Flat volume',
    whyItMatters: 'Without dynamic variation in vocal intensity, presentations can sound mechanical even with strong verbal content.',
  },
  erratic_delivery: {
    label: 'Erratic delivery',
    whyItMatters: 'Sudden fluctuations in tempo create an uneven cadence that disrupts the listener’s predictive rhythm.',
  },
  pause_few: {
    label: 'Few pauses',
    whyItMatters: 'Continuous speech without punctuation breath marks gives listeners no mental space to register key takeaways.',
  },
  pause_excess: {
    label: 'Frequent pauses',
    whyItMatters: 'Fragmented phrasing breaks sentence momentum and can make arguments feel tentative.',
  },
  pause_long: {
    label: 'Long pause',
    whyItMatters: 'Unintended silences longer than 3 seconds create dead air unless visibly framed as a rhetorical pause.',
  },
  filler_heavy: {
    label: 'Filler words',
    whyItMatters: 'Clustered vocal fillers dilute perceived conciseness and distract from the core assertion.',
  },
  gesture_static: {
    label: 'Still hands',
    whyItMatters: 'Keeping hands completely still or locked at the waist deprives the audience of visual reinforcement for structural cues.',
  },
  gesture_excess: {
    label: 'Busy hands',
    whyItMatters: 'Continuous unanchored hand movement draws visual attention away from the speaker’s facial expression and slides.',
  },
  posture_sway: {
    label: 'Swaying',
    whyItMatters: 'Repetitive side-to-side weight shifting creates optical restlessness that communicates physical instability.',
  },
  posture_tilt: {
    label: 'Leaning',
    whyItMatters: 'Sustained asymmetric tilt throws the visual frame off balance and can look casual or fatigued.',
  },
  posture_slump: {
    label: 'Slumping',
    whyItMatters: 'Downward shoulder collapse diminishes chest projection and restricts vocal resonance.',
  },
  looking_away: {
    label: 'Looking away',
    whyItMatters: 'Extended focus away from the camera lens disconnects the speaker from the simulated audience eye-line.',
  },
  head_motion: {
    label: 'Head movement',
    whyItMatters: 'Excessive bobbing or head tilting draws the viewer’s eye away from steady communicative facial cues.',
  },
  strong: {
    label: 'Strong stretch',
    whyItMatters: 'Pace, pitch inflection, physical grounding, and camera engagement aligned cohesively during this window.',
  },

  // Compounds
  rushed_and_static: {
    label: 'Rushed and static',
    whyItMatters: 'High speaking pace coupled with motionless hands suggests rushing through material without physical punctuation.',
  },
  low_energy: {
    label: 'Low energy',
    whyItMatters: 'Simultaneous flat pitch dynamics and minimal gesture activity create an emotionally detached delivery.',
  },
  lost_thread: {
    label: 'Lost thread',
    whyItMatters: 'A long pause combined with an extended glance away from the camera indicates a moment of recovery or re-orienting.',
  },
  breathless_rush: {
    label: 'Breathless rush',
    whyItMatters: 'A rapid speaking tempo with near-zero pause ratio deprives both speaker and audience of breathing space.',
  },
};

export function getSubtypeLabel(subtype: string): string {
  return SUBTYPES_CONTENT[subtype]?.label ?? subtype.replace(/_/g, ' ');
}

export function getSubtypeWhy(subtype: string): string {
  return SUBTYPES_CONTENT[subtype]?.whyItMatters ?? 'Delivery signal observed outside reference bounds during this stretch.';
}
