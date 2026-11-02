import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { DimensionKey, EventItem } from '../types/report';

export interface SessionFilters {
  kind: 'all' | 'weak' | 'severe' | 'strong';
  dimensions: DimensionKey[];
}

export interface SessionState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  rate: number;
  selectedEventId: string | null;
  hoverTime: number | null;
  filters: SessionFilters;
  events: EventItem[];
  followTranscript: boolean;
}

type SessionAction =
  | { type: 'SET_TIME'; payload: number }
  | { type: 'SET_DURATION'; payload: number }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_RATE'; payload: number }
  | { type: 'SELECT_EVENT'; payload: string | null }
  | { type: 'SET_HOVER_TIME'; payload: number | null }
  | { type: 'SET_FILTER_KIND'; payload: SessionFilters['kind'] }
  | { type: 'TOGGLE_FILTER_DIMENSION'; payload: DimensionKey }
  | { type: 'SET_EVENTS'; payload: EventItem[] }
  | { type: 'TOGGLE_TRANSCRIPT_FOLLOW' };

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_TIME':
      return {
        ...state,
        currentTime: Math.max(0, Math.min(state.duration || 1000, action.payload)),
      };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'PLAY':
      return { ...state, isPlaying: true };
    case 'PAUSE':
      return { ...state, isPlaying: false };
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };
    case 'SET_RATE':
      return { ...state, rate: action.payload };
    case 'SELECT_EVENT':
      return { ...state, selectedEventId: action.payload };
    case 'SET_HOVER_TIME':
      return { ...state, hoverTime: action.payload };
    case 'SET_FILTER_KIND':
      return {
        ...state,
        filters: { ...state.filters, kind: action.payload },
      };
    case 'TOGGLE_FILTER_DIMENSION': {
      const exists = state.filters.dimensions.includes(action.payload);
      const dimensions = exists
        ? state.filters.dimensions.filter((d) => d !== action.payload)
        : [...state.filters.dimensions, action.payload];
      return {
        ...state,
        filters: { ...state.filters, dimensions },
      };
    }
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    case 'TOGGLE_TRANSCRIPT_FOLLOW':
      return { ...state, followTranscript: !state.followTranscript };
    default:
      return state;
  }
}

interface SessionContextType extends SessionState {
  seek: (t: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setRate: (r: number) => void;
  selectEvent: (id: string | null) => void;
  nextEvent: () => void;
  prevEvent: () => void;
  playEventSpan: (ev: EventItem) => void;
  setHoverTime: (t: number | null) => void;
  setFilterKind: (k: SessionFilters['kind']) => void;
  toggleFilterDimension: (d: DimensionKey) => void;
  toggleTranscriptFollow: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({
  duration,
  events = [],
  children,
}: {
  duration: number;
  events?: EventItem[];
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(sessionReducer, {
    currentTime: 0,
    duration: duration || 212.4,
    isPlaying: false,
    rate: 1.0,
    selectedEventId: null,
    hoverTime: null,
    filters: {
      kind: 'all',
      dimensions: [],
    },
    events,
    followTranscript: true,
  });

  useEffect(() => {
    dispatch({ type: 'SET_DURATION', payload: duration });
  }, [duration]);

  useEffect(() => {
    dispatch({ type: 'SET_EVENTS', payload: events });
  }, [events]);

  const seek = useCallback((t: number) => {
    dispatch({ type: 'SET_TIME', payload: t });
  }, []);

  const play = useCallback(() => {
    dispatch({ type: 'PLAY' });
  }, []);

  const pause = useCallback(() => {
    dispatch({ type: 'PAUSE' });
  }, []);

  const togglePlay = useCallback(() => {
    dispatch({ type: 'TOGGLE_PLAY' });
  }, []);

  const setRate = useCallback((r: number) => {
    dispatch({ type: 'SET_RATE', payload: r });
  }, []);

  const selectEvent = useCallback(
    (id: string | null) => {
      dispatch({ type: 'SELECT_EVENT', payload: id });
      if (id) {
        const found = state.events.find((e) => e.id === id);
        if (found) {
          seek(found.t0);
        }
      }
    },
    [state.events, seek]
  );

  const nextEvent = useCallback(() => {
    const list = state.events;
    if (list.length === 0) return;
    if (!state.selectedEventId) {
      selectEvent(list[0].id);
      return;
    }
    const idx = list.findIndex((e) => e.id === state.selectedEventId);
    if (idx !== -1 && idx < list.length - 1) {
      selectEvent(list[idx + 1].id);
    }
  }, [state.events, state.selectedEventId, selectEvent]);

  const prevEvent = useCallback(() => {
    const list = state.events;
    if (list.length === 0) return;
    if (!state.selectedEventId) {
      selectEvent(list[list.length - 1].id);
      return;
    }
    const idx = list.findIndex((e) => e.id === state.selectedEventId);
    if (idx > 0) {
      selectEvent(list[idx - 1].id);
    }
  }, [state.events, state.selectedEventId, selectEvent]);

  const playEventSpan = useCallback(
    (ev: EventItem) => {
      selectEvent(ev.id);
      seek(ev.t0);
      play();
    },
    [selectEvent, seek, play]
  );

  const setHoverTime = useCallback((t: number | null) => {
    dispatch({ type: 'SET_HOVER_TIME', payload: t });
  }, []);

  const setFilterKind = useCallback((k: SessionFilters['kind']) => {
    dispatch({ type: 'SET_FILTER_KIND', payload: k });
  }, []);

  const toggleFilterDimension = useCallback((d: DimensionKey) => {
    dispatch({ type: 'TOGGLE_FILTER_DIMENSION', payload: d });
  }, []);

  const toggleTranscriptFollow = useCallback(() => {
    dispatch({ type: 'TOGGLE_TRANSCRIPT_FOLLOW' });
  }, []);

  return (
    <SessionContext.Provider
      value={{
        ...state,
        seek,
        play,
        pause,
        togglePlay,
        setRate,
        selectEvent,
        nextEvent,
        prevEvent,
        playEventSpan,
        setHoverTime,
        setFilterKind,
        toggleFilterDimension,
        toggleTranscriptFollow,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
