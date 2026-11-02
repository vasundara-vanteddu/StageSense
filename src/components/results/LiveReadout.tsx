
import React from 'react';
import { DimensionKey, WindowData } from '../../lib/types/report';
import { DimensionGlyph } from '../shared/BandBadge';

interface LiveReadoutProps {
  windows: WindowData[];
  currentTime: number;
  onOpenDimension?: (d: DimensionKey) => void;
  className?: string;
}

const formatMetric = (
  value: unknown,
  formatter: (value: number) => string,
): string => {
  return typeof value === 'number' && Number.isFinite(value)
    ? formatter(value)
    : '—';
};

const DIMENSIONS: {
  key: DimensionKey;
  shortLabel: string;
  getMetricStr: (w: WindowData) => string;
}[] = [
  {
    key: 'speaking_rate',
    shortLabel: 'Pace',
    getMetricStr: (w) =>
      formatMetric(w.metrics?.wpm, (v) => `${v} wpm`),
  },
  {
    key: 'vocal_expressiveness',
    shortLabel: 'Voice',
    getMetricStr: (w) =>
      formatMetric(w.metrics?.pitch_sd_st, (v) => `${v} st`),
  },
  {
    key: 'pausing_fluency',
    shortLabel: 'Pauses',
    getMetricStr: (w) =>
      formatMetric(w.metrics?.pause_ratio, (v) => `${Math.round(v * 100)}% pause`),
  },
  {
    key: 'gestures',
    shortLabel: 'Hands',
    getMetricStr: (w) =>
      formatMetric(w.metrics?.gesture_activity, (v) => `${v} act`),
  },
  {
    key: 'posture',
    shortLabel: 'Posture',
    getMetricStr: (w) =>
      formatMetric(w.metrics?.sway, (v) => `${v} sway`),
  },
  {
    key: 'visual_engagement',
    shortLabel: 'Focus',
    getMetricStr: (w) =>
      formatMetric(w.metrics?.facing_fraction, (v) => `${Math.round(v * 100)}% face`),
  },
];

export function LiveReadout({
  windows,
  currentTime,
  onOpenDimension,
  className = '',
}: LiveReadoutProps) {
  const activeWindow =
    windows.find((w) => currentTime >= w.t0 && currentTime <= w.t1) ??
    windows[0];

  if (!activeWindow) return null;

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 w-full select-none ${className}`}
    >
      {DIMENSIONS.map((d) => {
        const state = activeWindow.states[d.key];
        const rawScore: unknown = activeWindow.scores[d.key];

        const score =
          typeof rawScore === 'number' && Number.isFinite(rawScore)
            ? rawScore
            : rawScore !== null &&
                typeof rawScore === 'object' &&
                'score' in rawScore &&
                typeof rawScore.score === 'number' &&
                Number.isFinite(rawScore.score)
              ? rawScore.score
              : null;

        const metricStr = d.getMetricStr(activeWindow);

        let dotColor = 'bg-[#79C8DF]';
        let stateLabel = 'Normal';
        let textColor = 'text-[#DCEFF8]';

        if (state === 'strong') {
          dotColor = 'bg-[#6FE3B8] shadow-[0_0_6px_#6FE3B8]';
          stateLabel = 'Strong';
          textColor = 'text-[#8FEBC9]';
        } else if (state === 'weak') {
          dotColor = 'bg-[#F2B75B] shadow-[0_0_6px_#F2B75B]';
          stateLabel = 'Weak';
          textColor = 'text-[#F6C77F]';
        } else if (state === 'severe') {
          dotColor = 'bg-[#F2766B] shadow-[0_0_6px_#F2766B]';
          stateLabel = 'Severe';
          textColor = 'text-[#F8978D]';
        } else if (state === null) {
          dotColor = 'bg-[#4D647A]';
          stateLabel = 'Not scored';
          textColor = 'text-[#7C93A9]';
        }

        return (
          <button
            key={d.key}
            type="button"
            onClick={() => onOpenDimension?.(d.key)}
            className="flex items-center justify-between p-2 rounded-xl bg-[#0B1A2D] border border-[#17324F] hover:border-[#79C8DF]/40 transition-colors text-left"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <DimensionGlyph
                dimension={d.key}
                className="w-3.5 h-3.5 text-[#79C8DF] shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-mono text-[#7C93A9] truncate">
                  {d.shortLabel}
                </span>
                <span className="text-xs font-mono font-bold text-[#F7FAFC] tabular-nums truncate">
                  {metricStr}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end shrink-0 ml-1">
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                <span className={`text-[10px] font-mono font-medium ${textColor}`}>
                  {score !== null ? score : '—'}
                </span>
              </div>
              <span className="text-[9px] font-mono text-[#537FA5]">
                {stateLabel}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
