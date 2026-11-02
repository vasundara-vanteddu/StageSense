import {
  ApiError,
  JobStatus,
  MethodologyResponse,
  Report,
} from '../types/report';
import { User } from '../types/auth';
import { DEFAULT_METHODOLOGY_RESPONSE } from '../../mocks/methodology';
import { SAMPLE_REPORTS } from '../../mocks/samples';

interface StoredMockJob {
  id: string;
  filename: string;
  duration_s: number;
  startTime: number;
  failsWith?: 'NO_SPEECH_DETECTED' | 'SERVER_RESTARTED';
}

const STORAGE_KEY_JOBS = 'stagesense.mock.jobs.v1';
const STORAGE_KEY_AUTH = 'stagesense.mock.auth.v1';
const STORAGE_KEY_ATTEMPTS = 'stagesense.mock.attempts.v1';

// Seeded demo account
// Mock only: never store passwords like this in production.
const SEEDED_USER: User & { passwordHash: string } = {
  id: 'usr_demo_882',
  email: 'demo@stagesense.dev',
  display_name: 'Demo Presenter',
  created_at: '2026-01-15T00:00:00.000Z',
  passwordHash: 'Rehearse!2026',
};

function getStoredJobs(): Record<string, StoredMockJob> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_JOBS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredJobs(jobs: Record<string, StoredMockJob>) {
  try {
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(jobs));
  } catch {
    // Ignore storage quota errors
  }
}

function getStoredAuth(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStoredAuth(user: User | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_AUTH);
    }
  } catch {
    // Ignore
  }
}

export const mockApi = {
  async health(): Promise<{ status: string }> {
    return { status: 'healthy (mock mode)' };
  },

  async getMethodology(): Promise<MethodologyResponse> {
    return DEFAULT_METHODOLOGY_RESPONSE;
  },

  async createJob(
    file: File,
    options?: { onProgress?: (pct: number, loaded: number, total: number) => void; signal?: AbortSignal }
  ): Promise<{ job_id: string }> {
    const totalBytes = file.size || 1024 * 1024 * 12;
    const steps = 10;
    const stepDuration = 250; // ~2.5s total progress simulation

    for (let i = 1; i <= steps; i++) {
      if (options?.signal?.aborted) {
        throw new Error('Upload aborted');
      }
      await new Promise((resolve) => setTimeout(resolve, stepDuration));
      const pct = Math.round((i / steps) * 100);
      options?.onProgress?.(pct, Math.round((pct / 100) * totalBytes), totalBytes);
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const lowerName = file.name.toLowerCase();

    let failsWith: 'NO_SPEECH_DETECTED' | 'SERVER_RESTARTED' | undefined;
    if (lowerName.includes('fail')) {
      failsWith = 'NO_SPEECH_DETECTED';
    } else if (lowerName.includes('restart')) {
      failsWith = 'SERVER_RESTARTED';
    }

    const jobs = getStoredJobs();
    jobs[jobId] = {
      id: jobId,
      filename: file.name,
      duration_s: 212.4,
      startTime: Date.now(),
      failsWith,
    };
    saveStoredJobs(jobs);

    return { job_id: jobId };
  },

  async getJob(id: string): Promise<JobStatus> {
    const jobs = getStoredJobs();
    const stored = jobs[id];

    // If it is one of the static sample IDs, return done
    if (SAMPLE_REPORTS[id]) {
      return {
        job_id: id,
        status: 'done',
        stage: 'writing',
        progress: 1.0,
        stages: [
          { id: 'listening', label: 'Listening', state: 'done' },
          { id: 'watching', label: 'Watching', state: 'done' },
          { id: 'aligning', label: 'Aligning', state: 'done' },
          { id: 'writing', label: 'Writing', state: 'done' },
        ],
        error: null,
        duration_s: SAMPLE_REPORTS[id].meta.duration_s,
        created_at: SAMPLE_REPORTS[id].meta.analysed_at,
      };
    }

    if (!stored) {
      // Create fallback job entry if queried directly
      const fallback: StoredMockJob = {
        id,
        filename: 'Rehearsal_Session.mp4',
        duration_s: 212.4,
        startTime: Date.now() - 30000,
      };
      return {
        job_id: id,
        status: 'done',
        stage: 'writing',
        progress: 1.0,
        stages: [
          { id: 'listening', label: 'Listening', state: 'done' },
          { id: 'watching', label: 'Watching', state: 'done' },
          { id: 'aligning', label: 'Aligning', state: 'done' },
          { id: 'writing', label: 'Writing', state: 'done' },
        ],
        error: null,
        duration_s: fallback.duration_s,
        created_at: new Date(fallback.startTime).toISOString(),
      };
    }

    const elapsedSeconds = (Date.now() - stored.startTime) / 1000;

    // Check simulated failure after ~9 seconds
    if (stored.failsWith && elapsedSeconds >= 9) {
      const code = stored.failsWith;
      const msg =
        code === 'NO_SPEECH_DETECTED'
          ? "We couldn't hear enough speech in the recording."
          : 'The server restarted during analysis.';
      const hint =
        code === 'NO_SPEECH_DETECTED'
          ? 'StageSense analyses English speech. Record closer to the microphone and try again.'
          : 'Upload the video again to retry.';

      return {
        job_id: id,
        status: 'failed',
        stage: 'listening',
        progress: 0.38,
        stages: [
          { id: 'listening', label: 'Listening', state: 'failed' },
          { id: 'watching', label: 'Watching', state: 'active' },
          { id: 'aligning', label: 'Aligning', state: 'waiting' },
          { id: 'writing', label: 'Writing', state: 'waiting' },
        ],
        error: { code, message: msg, hint },
        duration_s: stored.duration_s,
        created_at: new Date(stored.startTime).toISOString(),
      };
    }

    // 0–2s preprocessing
    // 2–15s listening & watching in parallel
    // 15–19s aligning
    // 19–24s writing
    // >=24s done
    let status: JobStatus['status'] = 'transcribing';
    let stage = 'listening';
    let progress = Math.min(1.0, elapsedSeconds / 24);

    const stages: JobStatus['stages'] = [
      { id: 'listening', label: 'Listening', state: 'waiting' },
      { id: 'watching', label: 'Watching', state: 'waiting' },
      { id: 'aligning', label: 'Aligning', state: 'waiting' },
      { id: 'writing', label: 'Writing', state: 'waiting' },
    ];

    if (elapsedSeconds < 2) {
      status = 'preprocessing';
      progress = Math.max(0.04, elapsedSeconds / 24);
      stage = 'preprocessing';
    } else if (elapsedSeconds < 15) {
      // Parallel execution: listening & watching active simultaneously!
      status = 'transcribing';
      stage = 'listening';
      stages[0].state = 'active';
      stages[1].state = 'active';
      progress = 0.08 + ((elapsedSeconds - 2) / 13) * 0.55;
    } else if (elapsedSeconds < 19) {
      status = 'aligning';
      stage = 'aligning';
      stages[0].state = 'done';
      stages[1].state = 'done';
      stages[2].state = 'active';
      progress = 0.63 + ((elapsedSeconds - 15) / 4) * 0.22;
    } else if (elapsedSeconds < 24) {
      status = 'writing';
      stage = 'writing';
      stages[0].state = 'done';
      stages[1].state = 'done';
      stages[2].state = 'done';
      stages[3].state = 'active';
      progress = 0.85 + ((elapsedSeconds - 19) / 5) * 0.14;
    } else {
      status = 'done';
      stage = 'writing';
      stages[0].state = 'done';
      stages[1].state = 'done';
      stages[2].state = 'done';
      stages[3].state = 'done';
      progress = 1.0;
    }

    return {
      job_id: id,
      status,
      stage,
      progress: Math.min(1.0, Number(progress.toFixed(2))),
      stages,
      error: null,
      duration_s: stored.duration_s,
      created_at: new Date(stored.startTime).toISOString(),
    };
  },
  async startAnalysis(
  id: string
): Promise<{ job_id: string; status: string }> {
  const jobs = getStoredJobs();

  if (!jobs[id]) {
    throw {
      error: {
        code: 'JOB_NOT_FOUND',
        message: 'Job not found.',
        hint: 'Upload the video again.',
      },
    };
  }

  return {
    job_id: id,
    status: 'processing',
  };
},

  async getReport(id: string): Promise<Report> {
    if (SAMPLE_REPORTS[id]) {
      return SAMPLE_REPORTS[id];
    }

    const jobs = getStoredJobs();
    const stored = jobs[id];
    const realFilename = stored ? stored.filename : 'Recorded_Rehearsal.mp4';

    // Pick one of the three samples deterministically based on hash of id
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
    const sampleKeys = ['product-pitch', 'thesis-update', 'lab-update'];
    const chosenKey = sampleKeys[Math.abs(hash) % sampleKeys.length];
    const baseSample = SAMPLE_REPORTS[chosenKey];

    return {
      ...baseSample,
      job_id: id,
      meta: {
        ...baseSample.meta,
        filename: realFilename,
        analysed_at: stored ? new Date(stored.startTime + 24000).toISOString() : baseSample.meta.analysed_at,
      },
    };
  },

  async getVideoUrl(id: string): Promise<string | null> {
    const base = import.meta.env.VITE_SAMPLE_VIDEO_BASE || '';
    if (base && SAMPLE_REPORTS[id]) {
      return `${base}/${id}.mp4`;
    }
    return null;
  },

  async deleteJob(id: string): Promise<void> {
    const jobs = getStoredJobs();
    delete jobs[id];
    saveStoredJobs(jobs);
  },

  async listJobs(): Promise<JobStatus[]> {
    const jobs = getStoredJobs();
    const list: JobStatus[] = [];
    for (const id of Object.keys(jobs)) {
      list.push(await this.getJob(id));
    }
    return list;
  },

  // Auth mock methods
  auth: {
    async me(): Promise<User | null> {
      await new Promise((r) => setTimeout(r, 120));
      return getStoredAuth();
    },

    async login(email: string, pass: string): Promise<User> {
      await new Promise((r) => setTimeout(r, 400));
      const cleanEmail = email.trim().toLowerCase();

      // Check lockout attempts
      const attemptsKey = `${STORAGE_KEY_ATTEMPTS}_${cleanEmail}`;
      const failedCount = Number(localStorage.getItem(attemptsKey) || '0');
      if (failedCount >= 5) {
        const err: ApiError = {
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many attempts. Wait a minute and try again.',
            hint: 'Security cooldown active.',
          },
        };
        throw err;
      }

      if (cleanEmail === SEEDED_USER.email && pass === SEEDED_USER.passwordHash) {
        localStorage.removeItem(attemptsKey);
        saveStoredAuth(SEEDED_USER);
        return SEEDED_USER;
      }

      // Check dynamically registered user in localStorage
      const customUsersKey = 'stagesense.mock.registered_users';
      const customUsers = JSON.parse(localStorage.getItem(customUsersKey) || '{}');
      if (customUsers[cleanEmail] && customUsers[cleanEmail].password === pass) {
        localStorage.removeItem(attemptsKey);
        const user: User = {
          id: customUsers[cleanEmail].id,
          email: cleanEmail,
          display_name: customUsers[cleanEmail].name,
          created_at: customUsers[cleanEmail].created_at,
        };
        saveStoredAuth(user);
        return user;
      }

      // Record failed attempt
      localStorage.setItem(attemptsKey, String(failedCount + 1));
      const err: ApiError = {
        error: {
          code: 'INVALID_CREDENTIALS',
          message: "That email and password don't match.",
          hint: 'Try demo@stagesense.dev / Rehearse!2026',
        },
      };
      throw err;
    },

    async register(name: string, email: string, pass: string): Promise<User> {
      await new Promise((r) => setTimeout(r, 400));
      const cleanEmail = email.trim().toLowerCase();

      if (cleanEmail === SEEDED_USER.email) {
        const err: ApiError = {
          error: {
            code: 'EMAIL_TAKEN',
            message: 'An account with this email already exists.',
            hint: 'Sign in instead.',
          },
        };
        throw err;
      }

      const customUsersKey = 'stagesense.mock.registered_users';
      const customUsers = JSON.parse(localStorage.getItem(customUsersKey) || '{}');
      if (customUsers[cleanEmail]) {
        const err: ApiError = {
          error: {
            code: 'EMAIL_TAKEN',
            message: 'An account with this email already exists.',
            hint: 'Sign in instead.',
          },
        };
        throw err;
      }

      const user: User = {
        id: `usr_${Date.now()}`,
        email: cleanEmail,
        display_name: name || 'Presenter',
        created_at: new Date().toISOString(),
      };

      customUsers[cleanEmail] = {
        ...user,
        password: pass,
      };
      localStorage.setItem(customUsersKey, JSON.stringify(customUsers));
      saveStoredAuth(user);
      return user;
    },

    async logout(): Promise<void> {
      await new Promise((r) => setTimeout(r, 100));
      saveStoredAuth(null);
    },

    async requestPasswordReset(email: string): Promise<void> {
      await new Promise((r) => setTimeout(r, 350));
      // Mock mode does nothing
    },
  },
};
