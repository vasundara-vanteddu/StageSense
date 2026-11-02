import React from 'react';
import { WindowData } from '../../lib/types/report';

export function SpeechActivityRibbon({
  windows,
  duration,
  currentTime,
  className = '',
}: {
  windows: WindowData[];
  duration: number;
  currentTime?: number;
  className?: string;
}) {
  if (!windows || windows.length === 0) return null;

  return (
    <div className={`relative flex flex-col gap-1 w-full select-none ${className}`}>
      <div className="flex items-center justify-between text-[11px] font-mono text-[#7C93A9]">
        <span>Speech activity (from pause ratio)</span>
        <span className="text-[10px] text-[#4D647A]">Acoustic presence</span>
      </div>

      <div className="relative h-8 w-full bg-[#0B1A2D]/70 rounded-md border border-[#17324F] overflow-hidden flex items-center px-1">
        {/* Mirrored vertical bars */}
        <div className="flex items-center justify-between w-full h-full gap-[1px]">
          {windows.map((w, idx) => {
            const pauseRatio = w.metrics.pause_ratio ?? 0.15;
            const presence = Math.max(0.15, Math.min(1.0, 1 - pauseRatio));
            const barHeightPct = Math.round(presence * 85);

            // Highlight bar if playhead is currently inside this window
            const isCurrent = currentTime !== undefined && currentTime >= w.t0 && currentTime <= w.t1;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center justify-center h-full group"
                title={`${w.t0}s–${w.t1}s: ${(presence * 100).toFixed(0)}% speech activity`}
              >
                <div
                  className={`w-full rounded-sm transition-all duration-150 ${
                    isCurrent
                      ? 'bg-[#F7FAFC] shadow-[0_0_8px_#79C8DF]'
                      : 'bg-[#79C8DF]/50 hover:bg-[#79C8DF]/80'
                  }`}
                  style={{ height: `${barHeightPct}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Playhead beam line */}
        {currentTime !== undefined && duration > 0 && (
          <div
            className="absolute top-0 bottom-0 w-[1.5px] bg-[#F7FAFC] shadow-[0_0_8px_#79C8DF] pointer-events-none"
            style={{ left: `${Math.min(100, Math.max(0, (currentTime / duration) * 100))}%` }}
          />
        )}
      </div>
    </div>
  );
}
