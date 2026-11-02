export interface ErrorCopy {
  title: string;
  hint: string;
}

export const ERROR_COPY_DECK: Record<string, ErrorCopy> = {
  UNSUPPORTED_FORMAT: {
    title: "That file type isn't supported.",
    hint: 'Use MP4, MOV, WEBM or MKV.',
  },
  FILE_TOO_LARGE: {
    title: 'This video is over 500 MB.',
    hint: 'Export at 720p or trim it, then try again.',
  },
  TOO_SHORT: {
    title: 'This video is shorter than 60 seconds.',
    hint: 'StageSense needs at least a minute of speech to find patterns.',
  },
  TOO_LONG: {
    title: 'This video is longer than 15 minutes.',
    hint: 'Trim it to a section of up to 15 minutes.',
  },
  NO_AUDIO_STREAM: {
    title: "We couldn't find audio in this video.",
    hint: 'Check that the recording includes sound.',
  },
  NO_SPEECH_DETECTED: {
    title: "We couldn't hear enough speech.",
    hint: 'StageSense analyses English speech. Record closer to the microphone and try again.',
  },
  PROCESSING_TIMEOUT: {
    title: 'Analysis took too long and was stopped.',
    hint: 'Try a shorter video.',
  },
  SERVER_RESTARTED: {
    title: 'The server restarted during analysis.',
    hint: 'Upload the video again to retry.',
  },
  NETWORK: {
    title: "Can't reach the StageSense server.",
    hint: 'Check that the backend is running.',
  },
  INTERNAL: {
    title: 'Something went wrong on our side.',
    hint: 'Try again in a moment.',
  },
  // Auth errors
  INVALID_CREDENTIALS: {
    title: "That email and password don't match.",
    hint: 'Double-check your credentials or use the demo login.',
  },
  EMAIL_TAKEN: {
    title: 'An account with this email already exists.',
    hint: 'Sign in instead or use another email address.',
  },
  WEAK_PASSWORD: {
    title: 'Use at least 8 characters, with a letter and a number.',
    hint: 'Ensure your password meets the complexity requirements.',
  },
  RATE_LIMITED: {
    title: 'Too many attempts. Wait a minute and try again.',
    hint: 'Security cooldown active. Please pause before retrying.',
  },
};

export const WARNING_COPY_DECK: Record<string, string> = {
  CAMERA_ANGLE: 'You were mostly turned away from the camera, so camera-facing results may read low.',
  HANDS_NOT_VISIBLE: "Your hands weren't visible for most of the video, so Gestures isn't scored.",
  SHOULDERS_NOT_VISIBLE: "Your shoulders weren't visible enough to score Posture.",
  VISUAL_LOW_QUALITY: 'We could only track you in part of the video.',
};

export function getErrorCopy(code: string, fallbackMessage?: string, fallbackHint?: string): ErrorCopy {
  if (ERROR_COPY_DECK[code]) {
    return ERROR_COPY_DECK[code];
  }
  return {
    title: fallbackMessage || 'An unexpected error occurred.',
    hint: fallbackHint || 'Please try again or contact support if the problem persists.',
  };
}

export function getWarningCopy(code: string, fallbackMessage?: string): string {
  return WARNING_COPY_DECK[code] || fallbackMessage || 'A recording condition affected one or more dimension calculations.';
}
