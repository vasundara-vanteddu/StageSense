import {
  ApiError,
  JobStatus,
  MethodologyResponse,
  Report,
} from '../types/report';
import { User } from '../types/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorObj: ApiError = {
      error: {
        code: 'INTERNAL',
        message: `HTTP error ${res.status}`,
        hint: 'Please try again in a moment.',
      },
    };
    try {
      const data = await res.json();
      if (data?.error) {
        errorObj = data;
      } else if (data?.detail) {
        errorObj = {
          error: {
            code: res.status === 401 ? 'INVALID_CREDENTIALS' : 'INTERNAL',
            message: data.detail,
            hint: '',
          },
        };
      }
    } catch {
      // JSON parse failed
    }
    throw errorObj;
  }
  return res.json();
}

export const liveApi = {
  async health(): Promise<{ status: string }> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      return handleResponse(res);
    } catch (e: any) {
      if (e?.error) throw e;
      throw { error: { code: 'NETWORK', message: "Can't reach the StageSense server.", hint: 'Check that the backend is running.' } };
    }
  },

  async getMethodology(): Promise<MethodologyResponse> {
    try {
      const res = await fetch(`${API_BASE}/methodology`);
      return handleResponse(res);
    } catch (e: any) {
      if (e?.error) throw e;
      throw { error: { code: 'NETWORK', message: "Can't reach the StageSense server.", hint: 'Check that the backend is running.' } };
    }
  },

  createJob(
    file: File,
    options?: { onProgress?: (pct: number, loaded: number, total: number) => void; signal?: AbortSignal }
  ): Promise<{ job_id: string }> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/jobs`);
      xhr.withCredentials = true;

      if (options?.signal) {
        options.signal.addEventListener('abort', () => {
          xhr.abort();
          reject(new Error('Upload aborted'));
        });
      }

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && options?.onProgress) {
          const pct = Math.round((e.loaded / e.total) * 100);
          options.onProgress(pct, e.loaded, e.total);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject({ error: { code: 'INTERNAL', message: 'Invalid response from server.', hint: '' } });
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            reject(data);
          } catch {
            reject({ error: { code: 'INTERNAL', message: `Server error ${xhr.status}`, hint: '' } });
          }
        }
      };

      xhr.onerror = () => {
        reject({
          error: {
            code: 'NETWORK',
            message: "Can't reach the StageSense server.",
            hint: 'Check that the backend is running.',
          },
        });
      };

      const formData = new FormData();
      formData.append('file', file);
      xhr.send(formData);
    });
  },

  async getJob(id: string): Promise<JobStatus> {
    try {
      const res = await fetch(`${API_BASE}/jobs/${id}`, { credentials: 'include' });
      return handleResponse(res);
    } catch (e: any) {
      if (e?.error) throw e;
      throw { error: { code: 'NETWORK', message: "Can't reach the StageSense server.", hint: 'Check that the backend is running.' } };
    }
  },

  async startAnalysis(id: string): Promise<{ job_id: string; status: string }> {
    try {
      const res = await fetch(`${API_BASE}/jobs/${id}/analyze`, {
        method: 'POST',
        credentials: 'include',
      });
      return handleResponse(res);
    } catch (e: any) {
      if (e?.error) throw e;
      throw {
        error: {
          code: 'NETWORK',
          message: "Can't reach the StageSense server.",
          hint: 'Check that the backend is running.',
        },
      };
    }
  },


  async getReport(id: string): Promise<Report> {
    try {
      const res = await fetch(`${API_BASE}/jobs/${id}/report`, { credentials: 'include' });
      return handleResponse(res);
    } catch (e: any) {
      if (e?.error) throw e;
      throw { error: { code: 'NETWORK', message: "Can't reach the StageSense server.", hint: 'Check that the backend is running.' } };
    }
  },

  async getVideoUrl(id: string): Promise<string> {
    return `${API_BASE}/jobs/${id}/video`;
  },

  async deleteJob(id: string): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/jobs/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      return handleResponse(res);
    } catch (e: any) {
      if (e?.error) throw e;
      throw { error: { code: 'NETWORK', message: "Can't reach the StageSense server.", hint: 'Check that the backend is running.' } };
    }
  },

  async listJobs(): Promise<JobStatus[]> {
    try {
      const res = await fetch(`${API_BASE}/jobs`, { credentials: 'include' });
      return handleResponse(res);
    } catch (e: any) {
      if (e?.error) throw e;
      throw { error: { code: 'NETWORK', message: "Can't reach the StageSense server.", hint: 'Check that the backend is running.' } };
    }
  },

  auth: {
    async me(): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      credentials: 'include',
    });

    if (res.status === 401) return null;

    const data = await handleResponse<{ user: User }>(res);
    return data.user;
  } catch {
    return null;
  }
},

    async login(email: string, pass: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass }),
    credentials: 'include',
  });

  const data = await handleResponse<{ user: User }>(res);
  return data.user;
},

    async register(name: string, email: string, pass: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      display_name: name,
      email,
      password: pass,
    }),
    credentials: 'include',
  });

  const data = await handleResponse<{ user: User }>(res);
  return data.user;
},

    async logout(): Promise<void> {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    },

    async requestPasswordReset(email: string): Promise<void> {
      await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    },
  },
};
