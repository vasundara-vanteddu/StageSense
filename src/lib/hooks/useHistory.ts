import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Band } from '../types/report';
import { SAMPLE_REPORTS } from '../../mocks/samples';

export interface HistoryEntry {
  jobId: string;
  filename: string;
  createdAt: string;
  duration_s: number;
  status: 'done' | 'processing' | 'failed';
  overall?: number;
  band?: Band;
  composite_strip?: number[];
  errorMessage?: string;
  errorCode?: string;
}

export function useHistory() {
  const { currentIdentityKey } = useAuth();
  const storageKey = `stagesense.history.v1.${currentIdentityKey}`;

  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const loadFromStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setEntries(JSON.parse(raw));
      } else {
        // If empty for this identity, initialize empty array
        setEntries([]);
      }
    } catch {
      setEntries([]);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const saveEntries = useCallback((newEntries: HistoryEntry[]) => {
    setEntries(newEntries);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newEntries));
    } catch {
      // Ignore
    }
  }, [storageKey]);

  const addEntry = useCallback((entry: HistoryEntry) => {
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.jobId !== entry.jobId);
      const updated = [entry, ...filtered];
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [storageKey]);

  const updateEntry = useCallback((jobId: string, patch: Partial<HistoryEntry>) => {
    setEntries((prev) => {
      const updated = prev.map((e) => (e.jobId === jobId ? { ...e, ...patch } : e));
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [storageKey]);

  const removeEntry = useCallback((jobId: string) => {
    setEntries((prev) => {
      const updated = prev.filter((e) => e.jobId !== jobId);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [storageKey]);

  const clearHistory = useCallback(() => {
    setEntries([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }, [storageKey]);

  const seedDemoHistory = useCallback(() => {
    const p1 = SAMPLE_REPORTS['product-pitch'];
    const p2 = SAMPLE_REPORTS['thesis-update'];
    const p3 = SAMPLE_REPORTS['lab-update'];

    const seeded: HistoryEntry[] = [
      {
        jobId: 'product-pitch',
        filename: p1.meta.filename,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        duration_s: p1.meta.duration_s,
        status: 'done',
        overall: p1.overall.score,
        band: p1.overall.band,
        composite_strip: p1.windows.map((w) => w.composite),
      },
      {
        jobId: 'thesis-update',
        filename: p2.meta.filename,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
        duration_s: p2.meta.duration_s,
        status: 'done',
        overall: p2.overall.score,
        band: p2.overall.band,
        composite_strip: p2.windows.map((w) => w.composite),
      },
      {
        jobId: 'lab-update',
        filename: p3.meta.filename,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        duration_s: p3.meta.duration_s,
        status: 'done',
        overall: p3.overall.score,
        band: p3.overall.band,
        composite_strip: p3.windows.map((w) => w.composite),
      },
    ];

    saveEntries(seeded);
  }, [saveEntries]);

  return {
    entries,
    isLoaded,
    addEntry,
    updateEntry,
    removeEntry,
    clearHistory,
    seedDemoHistory,
    refresh: loadFromStorage,
  };
}
